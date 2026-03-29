using System.ComponentModel.DataAnnotations;

namespace QuizAPI.DTOs;

public record CreateQuizDto(
    [Required, MaxLength(200)] string Title,
    string Description,
    [Range(1, 180)] int TimeLimit,
    DateTime? StartTime,
    DateTime? EndTime,
    [Range(0, 100000)] int PassingMarks,
    List<string>? AllowedStudentEmails
);

public record UpdateQuizDto(
    [Required, MaxLength(200)] string Title,
    string Description,
    [Range(1, 180)] int TimeLimit,
    bool IsPublished,
    DateTime? StartTime,
    DateTime? EndTime,
    [Range(0, 100000)] int PassingMarks,
    List<string>? AllowedStudentEmails
);

/// <summary>
/// Status values:
///   Teacher: "draft" | "upcoming" | "active" | "completed" | "rejected"
///   Student: StudentStatus = "current" | "attempted" | "missed"
/// </summary>
public record QuizSummaryDto(
    Guid Id,
    string Title,
    string Description,
    int TimeLimit,
    bool IsPublished,
    int QuestionCount,
    int TotalMarks,
    int PassingMarks,
    DateTime CreatedAt,
    DateTime? StartTime,
    DateTime? EndTime,
    List<string> AllowedStudentEmails,
    string Status,
    string? StudentStatus
);

public record QuizDetailDto(
    Guid Id,
    string Title,
    string Description,
    int TimeLimit,
    bool IsPublished,
    int TotalMarks,
    int PassingMarks,
    List<QuestionDto> Questions,
    DateTime CreatedAt,
    DateTime? StartTime,
    DateTime? EndTime,
    List<string> AllowedStudentEmails,
    string Status
);
