using System.ComponentModel.DataAnnotations;

namespace QuizAPI.Models;

public class Quiz
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int TimeLimit { get; set; } = 30; // minutes (quiz duration)

    public bool IsPublished { get; set; } = false;

    public Guid CreatedById { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>When the quiz window opens (UTC). Null = no start restriction.</summary>
    public DateTime? StartTime { get; set; }

    /// <summary>When the quiz window closes (UTC). Null = no end restriction.</summary>
    public DateTime? EndTime { get; set; }

    /// <summary>Minimum percentage (0-100) required to pass. 0 = no passing requirement.</summary>
    public int PassingMarks { get; set; } = 0;

    /// <summary>Emails allowed to take this quiz. Empty = all students.</summary>
    public List<string> AllowedStudentEmails { get; set; } = new();

    public List<Question> Questions { get; set; } = new();
}
