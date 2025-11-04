using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.DTOs;

public class QuestionDto
{
    public int Id { get; set; }
    public int AssessmentId { get; set; }
    public QuestionType Type { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string[] Options { get; set; } = Array.Empty<string>();
    public string[] CorrectAnswers { get; set; } = Array.Empty<string>();
    public string? Explanation { get; set; }
    public int Points { get; set; }
    public int Order { get; set; }
}

public class CreateQuestionDto
{
    public int AssessmentId { get; set; }
    public QuestionType Type { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string[] Options { get; set; } = Array.Empty<string>();
    public string[] CorrectAnswers { get; set; } = Array.Empty<string>();
    public string? Explanation { get; set; }
    public int Points { get; set; }
    public int Order { get; set; }
}

public class UpdateQuestionDto
{
    public QuestionType Type { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string[] Options { get; set; } = Array.Empty<string>();
    public string[] CorrectAnswers { get; set; } = Array.Empty<string>();
    public string? Explanation { get; set; }
    public int Points { get; set; }
    public int Order { get; set; }
}
