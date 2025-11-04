using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.DTOs;

public class AssessmentDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public string ModuleName { get; set; } = string.Empty;
    public int? SectionId { get; set; }
    public string? SectionName { get; set; }
    public int? LessonId { get; set; }
    public int PassingScore { get; set; }
    public int TimeLimit { get; set; }
    public int MaxAttempts { get; set; }
    public bool IsActive { get; set; }
    public bool IsRequired { get; set; }
    public AssessmentTriggerType TriggerType { get; set; }
    public int TotalQuestions { get; set; }
    public int TotalPoints { get; set; }
    public List<QuestionDto> Questions { get; set; } = new();
    public AssessmentUserProgress? UserProgress { get; set; }
}

public class AssessmentUserProgress
{
    public int Attempts { get; set; }
    public int? LastScore { get; set; }
    public int? BestScore { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? LastAttempt { get; set; }
}

public class CreateAssessmentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int ModuleId { get; set; }
    public int? SectionId { get; set; }
    public int? LessonId { get; set; }
    public int PassingScore { get; set; }
    public int TimeLimit { get; set; }
    public int MaxAttempts { get; set; }
    public bool IsRequired { get; set; }
    public AssessmentTriggerType TriggerType { get; set; }
}

public class UpdateAssessmentDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int PassingScore { get; set; }
    public int TimeLimit { get; set; }
    public int MaxAttempts { get; set; }
    public bool IsActive { get; set; }
    public bool IsRequired { get; set; }
    public AssessmentTriggerType TriggerType { get; set; }
}
