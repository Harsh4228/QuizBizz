using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizAPI.DTOs;
using QuizAPI.Models;

namespace QuizAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QuizzesController : ControllerBase
{
    private readonly DataContext _context;

    public QuizzesController(DataContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Computes the quiz's lifecycle status from its publish state and time window.
    ///   draft    â€“ unpublished, start window not yet passed
    ///   upcoming â€“ published, start time is in the future
    ///   active   â€“ published, within startâ†’end window (or no time constraints)
    ///   completedâ€“ published, end time has passed
    ///   rejected â€“ start time passed but quiz was never published
    /// </summary>
    private static string ComputeStatus(Quiz quiz)
    {
        var now = DateTime.UtcNow;
        if (!quiz.IsPublished)
        {
            if (quiz.StartTime.HasValue && quiz.StartTime.Value <= now)
                return "rejected";
            return "draft";
        }
        if (quiz.StartTime.HasValue && quiz.StartTime.Value > now)
            return "upcoming";
        if (quiz.EndTime.HasValue && quiz.EndTime.Value <= now)
            return "completed";
        return "active";
    }

    [HttpGet]
    public async Task<ActionResult<List<QuizSummaryDto>>> GetQuizzes()
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var userEmail = User.FindFirstValue(ClaimTypes.Email)!;

        var query = _context.Quizzes.Include(q => q.Questions).AsQueryable();

        // Students only see published quizzes
        if (role != "Teacher")
            query = query.Where(q => q.IsPublished);

        var quizzes = await query.OrderByDescending(q => q.CreatedAt).ToListAsync();

        // For students, collect which quizzes they have completed
        HashSet<Guid> attemptedIds = new();
        if (role != "Teacher")
        {
            var ids = await _context.QuizAttempts
                .Where(a => a.UserId == userId && a.IsCompleted)
                .Select(a => a.QuizId)
                .ToListAsync();
            attemptedIds = ids.ToHashSet();
        }

        var result = new List<QuizSummaryDto>();
        foreach (var quiz in quizzes)
        {
            // Access control: skip quizzes this student isn't allowed to see
            if (role != "Teacher")
            {
                var allowed = quiz.AllowedStudentEmails.Count == 0 ||
                              quiz.AllowedStudentEmails.Contains(userEmail, StringComparer.OrdinalIgnoreCase);
                if (!allowed) continue;
            }

            var status = ComputeStatus(quiz);
            var totalMarks = quiz.Questions.Sum(q => q.Points);

            // Compute student-facing status
            string? studentStatus = null;
            if (role != "Teacher")
            {
                if (attemptedIds.Contains(quiz.Id))
                    studentStatus = "attempted";
                else if (status is "completed" or "rejected")
                    studentStatus = "missed";
                else if (status is "active" or "upcoming")
                    studentStatus = "current";
                else
                    continue; // draft â†’ not visible to students
            }

            result.Add(new QuizSummaryDto(
                quiz.Id, quiz.Title, quiz.Description, quiz.TimeLimit,
                quiz.IsPublished, quiz.Questions.Count, totalMarks,
                quiz.PassingMarks, quiz.CreatedAt, quiz.StartTime, quiz.EndTime,
                quiz.AllowedStudentEmails, status, studentStatus));
        }

        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<QuizDetailDto>> GetQuiz(Guid id)
    {
        var role = User.FindFirstValue(ClaimTypes.Role);
        var userEmail = User.FindFirstValue(ClaimTypes.Email)!;

        var quiz = await _context.Quizzes
            .Include(q => q.Questions.OrderBy(q => q.OrderIndex))
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null) return NotFound();
        if (!quiz.IsPublished && role != "Teacher") return Forbid();

        if (role != "Teacher")
        {
            var allowed = quiz.AllowedStudentEmails.Count == 0 ||
                          quiz.AllowedStudentEmails.Contains(userEmail, StringComparer.OrdinalIgnoreCase);
            if (!allowed) return Forbid();
        }

        var status = ComputeStatus(quiz);
        var totalMarks = quiz.Questions.Sum(q => q.Points);

        var questions = quiz.Questions
            .Select(q => new QuestionDto(q.Id, q.Text, q.Type, q.Options, q.Points, q.OrderIndex))
            .ToList();

        return Ok(new QuizDetailDto(
            quiz.Id, quiz.Title, quiz.Description, quiz.TimeLimit,
            quiz.IsPublished, totalMarks, quiz.PassingMarks, questions, quiz.CreatedAt,
            quiz.StartTime, quiz.EndTime, quiz.AllowedStudentEmails, status));
    }

    [HttpPost]
    [Authorize(Roles = "Teacher")]
    public async Task<ActionResult<QuizDetailDto>> CreateQuiz(CreateQuizDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var startUtc = dto.StartTime?.ToUniversalTime();
        var endUtc = dto.EndTime?.ToUniversalTime();

        if (startUtc.HasValue && startUtc.Value <= DateTime.UtcNow)
            return BadRequest("Start time must be in the future.");
        if (startUtc.HasValue && endUtc.HasValue && endUtc.Value <= startUtc.Value)
            return BadRequest("End time must be after start time.");
        if (!startUtc.HasValue && endUtc.HasValue && endUtc.Value <= DateTime.UtcNow)
            return BadRequest("End time must be in the future.");

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var quiz = new Quiz
        {
            Title = dto.Title,
            Description = dto.Description,
            TimeLimit = dto.TimeLimit,
            CreatedById = userId,
            StartTime = startUtc,
            EndTime = endUtc,
            PassingMarks = dto.PassingMarks,
            AllowedStudentEmails = dto.AllowedStudentEmails?
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .Select(e => e.Trim().ToLower())
                .Distinct()
                .ToList() ?? new()
        };

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuiz), new { id = quiz.Id },
            new QuizDetailDto(quiz.Id, quiz.Title, quiz.Description,
                quiz.TimeLimit, quiz.IsPublished, 0, quiz.PassingMarks, new List<QuestionDto>(),
                quiz.CreatedAt, quiz.StartTime, quiz.EndTime, quiz.AllowedStudentEmails,
                ComputeStatus(quiz)));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> UpdateQuiz(Guid id, UpdateQuizDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var quiz = await _context.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound();

        var startUtc = dto.StartTime?.ToUniversalTime();
        var endUtc = dto.EndTime?.ToUniversalTime();

        if (startUtc.HasValue && endUtc.HasValue && endUtc.Value <= startUtc.Value)
            return BadRequest("End time must be after start time.");

        // Prevent publishing a quiz whose start window already expired
        var currentStatus = ComputeStatus(quiz);
        if (dto.IsPublished && !quiz.IsPublished && currentStatus == "rejected")
            return BadRequest("Cannot publish: the start window has already passed. Update the start time first.");

        quiz.Title = dto.Title;
        quiz.Description = dto.Description;
        quiz.TimeLimit = dto.TimeLimit;
        quiz.IsPublished = dto.IsPublished;
        quiz.StartTime = startUtc;
        quiz.EndTime = endUtc;
        quiz.PassingMarks = dto.PassingMarks;
        quiz.AllowedStudentEmails = dto.AllowedStudentEmails?
            .Where(e => !string.IsNullOrWhiteSpace(e))
            .Select(e => e.Trim().ToLower())
            .Distinct()
            .ToList() ?? new();

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Teacher")]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        var quiz = await _context.Quizzes.FindAsync(id);
        if (quiz == null) return NotFound();

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
