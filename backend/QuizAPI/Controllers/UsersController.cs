using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizAPI.DTOs;
using QuizAPI.Models;

namespace QuizAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Teacher")]
public class UsersController : ControllerBase
{
    private readonly DataContext _context;

    public UsersController(DataContext context)
    {
        _context = context;
    }

    /// <summary>Returns all registered students (teacher-only).</summary>
    [HttpGet("students")]
    public async Task<ActionResult<List<StudentSummaryDto>>> GetStudents()
    {
        var students = await _context.Users
            .Where(u => u.Role == "Student")
            .OrderBy(u => u.Name)
            .Select(u => new StudentSummaryDto(u.Id, u.Name, u.Email))
            .ToListAsync();

        return Ok(students);
    }

    /// <summary>Returns full teacher dashboard data: quiz overview + student list.</summary>
    [HttpGet("dashboard")]
    public async Task<ActionResult<TeacherDashboardDto>> GetDashboard()
    {
        var now = DateTime.UtcNow;

        // --- Quizzes overview ---
        var quizzes = await _context.Quizzes
            .Include(q => q.Questions)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        // Load all completed attempts in one query
        var allAttempts = await _context.QuizAttempts
            .Where(a => a.IsCompleted)
            .Select(a => new { a.QuizId, a.Score, a.MaxScore })
            .ToListAsync();

        var attemptsByQuiz = allAttempts
            .GroupBy(a => a.QuizId)
            .ToDictionary(g => g.Key, g => g.ToList());

        string ComputeStatus(Quiz q)
        {
            if (!q.IsPublished)
            {
                if (q.StartTime.HasValue && q.StartTime.Value <= now) return "rejected";
                return "draft";
            }
            if (q.StartTime.HasValue && q.StartTime.Value > now) return "upcoming";
            if (q.EndTime.HasValue && q.EndTime.Value <= now) return "completed";
            return "active";
        }

        var quizOverviews = quizzes.Select(q =>
        {
            var attempts = attemptsByQuiz.GetValueOrDefault(q.Id, new());
            double avg = attempts.Count > 0 && attempts[0].MaxScore > 0
                ? Math.Round(attempts.Average(a => a.MaxScore > 0 ? (double)a.Score / a.MaxScore * 100 : 0), 1)
                : 0;
            return new QuizOverviewDto(
                q.Id,
                q.Title,
                ComputeStatus(q),
                q.Questions.Count,
                attempts.Count,
                avg,
                q.StartTime,
                q.EndTime);
        }).ToList();

        // --- Students overview ---
        var students = await _context.Users
            .Where(u => u.Role == "Student")
            .OrderBy(u => u.Name)
            .ToListAsync();

        var attemptsByUser = allAttempts
            .GroupBy(a => a.QuizId); // we need userId too — reload with userId

        var studentAttempts = await _context.QuizAttempts
            .Where(a => a.IsCompleted)
            .Select(a => new { a.UserId, a.Score, a.MaxScore })
            .ToListAsync();

        var attemptsByStudent = studentAttempts
            .GroupBy(a => a.UserId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var studentBriefs = students.Select(s =>
        {
            var sa = attemptsByStudent.GetValueOrDefault(s.Id, new());
            double avg = sa.Count > 0
                ? Math.Round(sa.Average(a => a.MaxScore > 0 ? (double)a.Score / a.MaxScore * 100 : 0), 1)
                : 0;
            return new StudentBriefDto(s.Id, s.Name, s.Email, sa.Count, avg, s.CreatedAt);
        }).ToList();

        int activeCount = quizOverviews.Count(q => q.Status == "active");
        int totalAttempts = allAttempts.Count;

        return Ok(new TeacherDashboardDto(
            quizzes.Count,
            activeCount,
            students.Count,
            totalAttempts,
            quizOverviews,
            studentBriefs));
    }

    /// <summary>Returns complete details for one student including all their attempts.</summary>
    [HttpGet("students/{id:guid}")]
    public async Task<ActionResult<StudentDetailDto>> GetStudentDetail(Guid id)
    {
        var student = await _context.Users.FirstOrDefaultAsync(u => u.Id == id && u.Role == "Student");
        if (student == null) return NotFound("Student not found.");

        var attempts = await _context.QuizAttempts
            .Include(a => a.Quiz)
            .Where(a => a.UserId == id && a.IsCompleted)
            .OrderByDescending(a => a.CompletedAt)
            .ToListAsync();

        var attemptDtos = attempts.Select(a =>
        {
            double pct = a.MaxScore > 0 ? Math.Round((double)a.Score / a.MaxScore * 100, 1) : 0;
            bool passed = a.Quiz.PassingMarks > 0
                ? a.Score >= a.Quiz.PassingMarks
                : pct >= 60;
            return new StudentAttemptSummaryDto(
                a.Id,
                a.QuizId,
                a.Quiz.Title,
                a.Score,
                a.MaxScore,
                pct,
                passed,
                a.Quiz.PassingMarks,
                a.CompletedAt!.Value);
        }).ToList();

        double overallAvg = attemptDtos.Count > 0
            ? Math.Round(attemptDtos.Average(a => a.Percentage), 1)
            : 0;

        return Ok(new StudentDetailDto(
            student.Id,
            student.Name,
            student.Email,
            student.CreatedAt,
            attemptDtos.Count,
            overallAvg,
            attemptDtos));
    }
}

