using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QuizAPI.DTOs;
using QuizAPI.Models;

namespace QuizAPI.Controllers;

[ApiController]
[Route("api/quizzes/{quizId:guid}/questions")]
[Authorize(Roles = "Teacher")]
public class QuestionsController : ControllerBase
{
    private readonly DataContext _context;

    public QuestionsController(DataContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<QuestionWithAnswerDto>>> GetQuestions(Guid quizId)
    {
        var quizExists = await _context.Quizzes.AnyAsync(q => q.Id == quizId);
        if (!quizExists) return NotFound("Quiz not found.");

        var questions = await _context.Questions
            .Where(q => q.QuizId == quizId)
            .OrderBy(q => q.OrderIndex)
            .Select(q => new QuestionWithAnswerDto(
                q.Id, q.Text, q.Type, q.Options, q.CorrectAnswer, q.Points, q.OrderIndex))
            .ToListAsync();

        return Ok(questions);
    }

    [HttpPost]
    public async Task<ActionResult<QuestionWithAnswerDto>> CreateQuestion(
        Guid quizId, CreateQuestionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var quizExists = await _context.Quizzes.AnyAsync(q => q.Id == quizId);
        if (!quizExists) return NotFound("Quiz not found.");

        var question = new Question
        {
            QuizId = quizId,
            Text = dto.Text,
            Type = dto.Type,
            Options = dto.Options,
            CorrectAnswer = dto.CorrectAnswer,
            Points = dto.Points,
            OrderIndex = dto.OrderIndex
        };

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetQuestions), new { quizId },
            new QuestionWithAnswerDto(question.Id, question.Text, question.Type,
                question.Options, question.CorrectAnswer, question.Points, question.OrderIndex));
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateQuestion(Guid quizId, Guid id, UpdateQuestionDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var question = await _context.Questions
            .FirstOrDefaultAsync(q => q.Id == id && q.QuizId == quizId);

        if (question == null) return NotFound();

        question.Text = dto.Text;
        question.Type = dto.Type;
        question.Options = dto.Options;
        question.CorrectAnswer = dto.CorrectAnswer;
        question.Points = dto.Points;
        question.OrderIndex = dto.OrderIndex;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteQuestion(Guid quizId, Guid id)
    {
        var question = await _context.Questions
            .FirstOrDefaultAsync(q => q.Id == id && q.QuizId == quizId);

        if (question == null) return NotFound();

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
