using System.ComponentModel.DataAnnotations;

namespace QuizAPI.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public string Role { get; set; } = "Student"; // Student | Teacher

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<QuizAttempt> Attempts { get; set; } = new();
}
