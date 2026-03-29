using System.ComponentModel.DataAnnotations;

namespace QuizAPI.DTOs;

public record CreateQuestionDto(
    [Required] string Text,
    string Type,
    List<string> Options,
    [Required] string CorrectAnswer,
    [Range(1, 10)] int Points,
    int OrderIndex
);

public record UpdateQuestionDto(
    [Required] string Text,
    string Type,
    List<string> Options,
    [Required] string CorrectAnswer,
    [Range(1, 10)] int Points,
    int OrderIndex
);

/// <summary>Returned to students — no correct answer exposed.</summary>
public record QuestionDto(
    Guid Id,
    string Text,
    string Type,
    List<string> Options,
    int Points,
    int OrderIndex
);

/// <summary>Returned to teachers — includes correct answer.</summary>
public record QuestionWithAnswerDto(
    Guid Id,
    string Text,
    string Type,
    List<string> Options,
    string CorrectAnswer,
    int Points,
    int OrderIndex
);
