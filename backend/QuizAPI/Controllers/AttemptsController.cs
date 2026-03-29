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
public class AttemptsController : ControllerBase
{
    private readonly DataContext _context;

    public AttemptsController(DataContext context)
    {
        _context = context;
    }

    [HttpPost("start")]
    public async Task<ActionResult> StartAttempt(StartAttemptDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == dto.QuizId);

        if (quiz == null) return NotFound("Quiz not found.");
        if (!quiz.IsPublished) return BadRequest("Quiz is not published.");

        // Check time window
        var now = DateTime.UtcNow;
        if (quiz.StartTime.HasValue && quiz.StartTime.Value > now)
            return BadRequest("This quiz has not started yet.");
        if (quiz.EndTime.HasValue && quiz.EndTime.Value <= now)
            return BadRequest("This quiz is no longer available — the submission window has closed.");

        // Check student access
        var userEmail = User.FindFirstValue(System.Security.Claims.ClaimTypes.Email)!;
        if (quiz.AllowedStudentEmails.Count > 0 &&
            !quiz.AllowedStudentEmails.Contains(userEmail, StringComparer.OrdinalIgnoreCase))
            return Forbid();

        // Prevent duplicate completions
        var alreadyCompleted = await _context.QuizAttempts
            .AnyAsync(a => a.QuizId == dto.QuizId && a.UserId == userId && a.IsCompleted);
        if (alreadyCompleted) return BadRequest("You have already completed this quiz.");

        var attempt = new QuizAttempt
        {
            QuizId = dto.QuizId,
            UserId = userId,
            MaxScore = quiz.Questions.Sum(q => q.Points)
        };

        _context.QuizAttempts.Add(attempt);
        await _context.SaveChangesAsync();

        return Ok(new { attemptId = attempt.Id });
    }

    [HttpPost("{attemptId:guid}/submit")]
    public async Task<ActionResult<AttemptResultDto>> SubmitAttempt(
        Guid attemptId, SubmitAttemptDto dto)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var attempt = await _context.QuizAttempts
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.UserId == userId);

        if (attempt == null) return NotFound("Attempt not found.");
        if (attempt.IsCompleted) return BadRequest("Attempt already submitted.");

        var questions = await _context.Questions
            .Where(q => q.QuizId == attempt.QuizId)
            .ToListAsync();

        var answerResults = new List<AnswerResultDto>();
        int totalScore = 0;

        foreach (var submission in dto.Answers)
        {
            var question = questions.FirstOrDefault(q => q.Id == submission.QuestionId);
            if (question == null) continue;

            bool isCorrect = string.Equals(
                submission.Answer.Trim(),
                question.CorrectAnswer.Trim(),
                StringComparison.OrdinalIgnoreCase);

            int pointsEarned = isCorrect ? question.Points : 0;
            totalScore += pointsEarned;

            _context.AttemptAnswers.Add(new AttemptAnswer
            {
                AttemptId = attemptId,
                QuestionId = submission.QuestionId,
                Answer = submission.Answer,
                IsCorrect = isCorrect,
                PointsEarned = pointsEarned
            });

            answerResults.Add(new AnswerResultDto(
                question.Id, question.Text, submission.Answer,
                question.CorrectAnswer, isCorrect, question.Points, pointsEarned));
        }

        attempt.Score = totalScore;
        attempt.IsCompleted = true;
        attempt.CompletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var duration = attempt.CompletedAt!.Value - attempt.StartedAt;
        double percentage = attempt.MaxScore > 0
            ? Math.Round((double)totalScore / attempt.MaxScore * 100, 1)
            : 0;

        return Ok(new AttemptResultDto(
            attempt.Id, totalScore, attempt.MaxScore, percentage, duration, answerResults));
    }

    [HttpGet("my")]
    public async Task<ActionResult<List<MyAttemptDto>>> GetMyAttempts()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var attempts = await _context.QuizAttempts
            .Include(a => a.Quiz)
            .Where(a => a.UserId == userId && a.IsCompleted)
            .OrderByDescending(a => a.CompletedAt)
            .Select(a => new MyAttemptDto(
                a.Id,
                a.Quiz.Title,
                a.Score,
                a.MaxScore,
                a.MaxScore > 0 ? Math.Round((double)a.Score / a.MaxScore * 100, 1) : 0,
                a.CompletedAt!.Value))
            .ToListAsync();

        return Ok(attempts);
    }

    [HttpGet("{attemptId:guid}")]
    public async Task<ActionResult<AttemptResultDto>> GetAttempt(Guid attemptId)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var attempt = await _context.QuizAttempts
            .Include(a => a.Answers)
                .ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(a => a.Id == attemptId && a.UserId == userId);

        if (attempt == null) return NotFound();
        if (!attempt.IsCompleted) return BadRequest("Attempt is not yet completed.");

        var answerResults = attempt.Answers.Select(a => new AnswerResultDto(
            a.QuestionId, a.Question.Text, a.Answer, a.Question.CorrectAnswer,
            a.IsCorrect, a.Question.Points, a.PointsEarned)).ToList();

        var duration = attempt.CompletedAt!.Value - attempt.StartedAt;
        double percentage = attempt.MaxScore > 0
            ? Math.Round((double)attempt.Score / attempt.MaxScore * 100, 1)
            : 0;

        return Ok(new AttemptResultDto(
            attempt.Id, attempt.Score, attempt.MaxScore, percentage, duration, answerResults));
    }
}
