namespace QuizAPI.Models;

public class AttemptAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid AttemptId { get; set; }
    public QuizAttempt Attempt { get; set; } = null!;

    public Guid QuestionId { get; set; }
    public Question Question { get; set; } = null!;

    public string Answer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int PointsEarned { get; set; }
}
