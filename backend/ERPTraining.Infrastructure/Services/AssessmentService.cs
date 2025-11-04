using AutoMapper;
using Microsoft.EntityFrameworkCore;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;

using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Infrastructure.Services;

public class AssessmentService : IAssessmentService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public AssessmentService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<AssessmentDto>> GetAllAssessmentsAsync(string userId)
    {
        var assessments = await _context.Assessments
            .Include(a => a.Module)
            .Include(a => a.Section)
            .Include(a => a.Questions)
            .Where(a => a.IsActive)
            .ToListAsync();

        var assessmentDtos = _mapper.Map<List<AssessmentDto>>(assessments);

        // Get user progress for each assessment
        foreach (var assessmentDto in assessmentDtos)
        {
            assessmentDto.UserProgress = await GetUserProgressAsync(assessmentDto.Id, userId);
        }

        return assessmentDtos;
    }

    public async Task<List<AssessmentDto>> GetAssessmentsByModuleIdAsync(int moduleId, string userId)
    {
        var assessments = await _context.Assessments
            .Include(a => a.Module)
            .Include(a => a.Section)
            .Include(a => a.Questions)
            .Where(a => a.ModuleId == moduleId && a.IsActive)
            .ToListAsync();

        var assessmentDtos = _mapper.Map<List<AssessmentDto>>(assessments);

        foreach (var assessmentDto in assessmentDtos)
        {
            assessmentDto.UserProgress = await GetUserProgressAsync(assessmentDto.Id, userId);
        }

        return assessmentDtos;
    }

    public async Task<AssessmentDto?> GetAssessmentByIdAsync(int id, string userId)
    {
        var assessment = await _context.Assessments
            .Include(a => a.Module)
            .Include(a => a.Section)
            .Include(a => a.Questions.OrderBy(q => q.Order))
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assessment == null) return null;

        var assessmentDto = _mapper.Map<AssessmentDto>(assessment);
        assessmentDto.UserProgress = await GetUserProgressAsync(id, userId);

        return assessmentDto;
    }

    public async Task<AssessmentDto> CreateAssessmentAsync(CreateAssessmentDto createAssessmentDto)
    {
        var assessment = _mapper.Map<Assessment>(createAssessmentDto);
        assessment.CreatedAt = DateTime.UtcNow;
        assessment.UpdatedAt = DateTime.UtcNow;
        assessment.IsActive = true;

        _context.Assessments.Add(assessment);
        await _context.SaveChangesAsync();

        // Load related entities for mapping
        await _context.Entry(assessment)
            .Reference(a => a.Module)
            .LoadAsync();

        if (assessment.SectionId.HasValue)
        {
            await _context.Entry(assessment)
                .Reference(a => a.Section)
                .LoadAsync();
        }

        return _mapper.Map<AssessmentDto>(assessment);
    }

    public async Task<AssessmentDto?> UpdateAssessmentAsync(int id, UpdateAssessmentDto updateAssessmentDto)
    {
        var assessment = await _context.Assessments
            .Include(a => a.Module)
            .Include(a => a.Section)
            .Include(a => a.Questions)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assessment == null) return null;

        _mapper.Map(updateAssessmentDto, assessment);
        assessment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return _mapper.Map<AssessmentDto>(assessment);
    }

    public async Task<bool> DeleteAssessmentAsync(int id)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return false;

        _context.Assessments.Remove(assessment);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleAssessmentStatusAsync(int id)
    {
        var assessment = await _context.Assessments.FindAsync(id);
        if (assessment == null) return false;

        assessment.IsActive = !assessment.IsActive;
        assessment.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<AssessmentUserProgress?> GetUserProgressAsync(int assessmentId, string userId)
    {
        var attempts = await _context.AssessmentAttempts
            .Where(aa => aa.AssessmentId == assessmentId && aa.UserId == userId)
            .OrderByDescending(aa => aa.StartedAt)
            .ToListAsync();

        if (!attempts.Any()) return null;

        var lastAttempt = attempts.First();
        var bestScore = attempts.Where(a => a.Status == AssessmentStatus.Completed).Max(a => (int?)a.Score);

        return new AssessmentUserProgress
        {
            Attempts = attempts.Count,
            LastScore = lastAttempt.Status == AssessmentStatus.Completed ? lastAttempt.Score : null,
            BestScore = bestScore,
            Status = GetStatusString(lastAttempt),
            LastAttempt = lastAttempt.StartedAt
        };
    }

    private static string GetStatusString(AssessmentAttempt attempt)
    {
        return attempt.Status switch
        {
            AssessmentStatus.InProgress => "in-progress",
            AssessmentStatus.Completed => attempt.Passed ? "completed" : "failed",
            AssessmentStatus.Abandoned => "failed",
            AssessmentStatus.TimeExpired => "failed",
            _ => "not-started"
        };
    }
}

public class QuestionService : IQuestionService
{
    private readonly ApplicationDbContext _context;
    private readonly IMapper _mapper;

    public QuestionService(ApplicationDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<QuestionDto>> GetQuestionsByAssessmentIdAsync(int assessmentId)
    {
        var questions = await _context.Questions
            .Where(q => q.AssessmentId == assessmentId)
            .OrderBy(q => q.Order)
            .ToListAsync();

        return _mapper.Map<List<QuestionDto>>(questions);
    }

    public async Task<QuestionDto?> GetQuestionByIdAsync(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        return question == null ? null : _mapper.Map<QuestionDto>(question);
    }

    public async Task<QuestionDto> CreateQuestionAsync(CreateQuestionDto createQuestionDto)
    {
        var question = _mapper.Map<Question>(createQuestionDto);
        question.CreatedAt = DateTime.UtcNow;
        question.UpdatedAt = DateTime.UtcNow;

        _context.Questions.Add(question);
        await _context.SaveChangesAsync();

        return _mapper.Map<QuestionDto>(question);
    }

    public async Task<QuestionDto?> UpdateQuestionAsync(int id, UpdateQuestionDto updateQuestionDto)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null) return null;

        _mapper.Map(updateQuestionDto, question);
        question.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return _mapper.Map<QuestionDto>(question);
    }

    public async Task<bool> DeleteQuestionAsync(int id)
    {
        var question = await _context.Questions.FindAsync(id);
        if (question == null) return false;

        _context.Questions.Remove(question);
        await _context.SaveChangesAsync();
        return true;
    }
}