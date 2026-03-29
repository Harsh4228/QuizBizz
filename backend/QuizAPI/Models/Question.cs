using System.ComponentModel.DataAnnotations;

namespace QuizAPI.Models;

public class Question
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; } = null!;

    [Required]
    public string Text { get; set; } = string.Empty;

    /// <summary>MultipleChoice | TrueFalse | ShortAnswer</summary>
    public string Type { get; set; } = "MultipleChoice";

    public List<string> Options { get; set; } = new();

    [Required]
    public string CorrectAnswer { get; set; } = string.Empty;

    public int Points { get; set; } = 1;

    public int OrderIndex { get; set; }
}
