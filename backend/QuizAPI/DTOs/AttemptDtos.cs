using System.ComponentModel.DataAnnotations;

namespace QuizAPI.DTOs;

public record StartAttemptDto([Required] Guid QuizId);

public record SubmitAnswerDto(Guid QuestionId, string Answer);

public record SubmitAttemptDto(List<SubmitAnswerDto> Answers);

public record AttemptResultDto(
    Guid AttemptId,
    int Score,
    int MaxScore,
    double Percentage,
    int PassingMarks,
    TimeSpan Duration,
    List<AnswerResultDto> AnswerResults
);

public record AnswerResultDto(
    Guid QuestionId,
    string QuestionText,
    string YourAnswer,
    string CorrectAnswer,
    bool IsCorrect,
    int Points,
    int PointsEarned
);

public record MyAttemptDto(
    Guid Id,
    string QuizTitle,
    int Score,
    int MaxScore,
    double Percentage,
    DateTime CompletedAt
);
