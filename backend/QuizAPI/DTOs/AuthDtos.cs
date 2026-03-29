using System.ComponentModel.DataAnnotations;

namespace QuizAPI.DTOs;

public record RegisterDto(
    [Required, MaxLength(100)] string Name,
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    string Role = "Student"
);

public record LoginDto(
    [Required, EmailAddress] string Email,
    [Required] string Password
);

public record AuthResponseDto(
    string Token,
    string Name,
    string Email,
    string Role,
    Guid UserId
);

public record StudentSummaryDto(
    Guid Id,
    string Name,
    string Email
);

// ─── Teacher Dashboard DTOs ───────────────────────────────────────────────────

public record TeacherDashboardDto(
    int TotalQuizzes,
    int ActiveQuizzes,
    int TotalStudents,
    int TotalAttempts,
    List<QuizOverviewDto> Quizzes,
    List<StudentBriefDto> Students
);

public record QuizOverviewDto(
    Guid Id,
    string Title,
    string Status,
    int QuestionCount,
    int AttemptCount,
    double AverageScore,
    DateTime? StartTime,
    DateTime? EndTime
);

public record StudentBriefDto(
    Guid Id,
    string Name,
    string Email,
    int AttemptCount,
    double AverageScore,
    DateTime JoinedAt
);

public record StudentDetailDto(
    Guid Id,
    string Name,
    string Email,
    DateTime JoinedAt,
    int TotalAttempts,
    double OverallAverage,
    List<StudentAttemptSummaryDto> Attempts
);

public record StudentAttemptSummaryDto(
    Guid AttemptId,
    Guid QuizId,
    string QuizTitle,
    int Score,
    int MaxScore,
    double Percentage,
    bool Passed,
    int PassingMarks,
    DateTime CompletedAt
);
