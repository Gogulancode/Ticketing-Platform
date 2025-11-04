using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using System.Security.Claims;

namespace ERPTraining.API.Controllers;

[ApiController]
[Route("api/[controller]")]
// [Authorize] // Temporarily commented for testing
public class AssessmentsController : ControllerBase
{
    private readonly IAssessmentService _assessmentService;
    private readonly IQuestionService _questionService;

    public AssessmentsController(IAssessmentService assessmentService, IQuestionService questionService)
    {
        _assessmentService = assessmentService;
        _questionService = questionService;
    }

    [HttpGet]
    public async Task<ActionResult<List<AssessmentDto>>> GetAllAssessments()
    {
        var userId = GetCurrentUserId();
        var assessments = await _assessmentService.GetAllAssessmentsAsync(userId);
        return Ok(assessments);
    }

    [HttpGet("module/{moduleId}")]
    public async Task<ActionResult<List<AssessmentDto>>> GetAssessmentsByModule(int moduleId)
    {
        var userId = GetCurrentUserId();
        var assessments = await _assessmentService.GetAssessmentsByModuleIdAsync(moduleId, userId);
        return Ok(assessments);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AssessmentDto>> GetAssessmentById(int id)
    {
        var userId = GetCurrentUserId();
        var assessment = await _assessmentService.GetAssessmentByIdAsync(id, userId);
        
        if (assessment == null)
            return NotFound();

        return Ok(assessment);
    }

    [HttpPost]
    // [Authorize(Roles = "Admin,QA")] // Temporarily commented for testing
    public async Task<ActionResult<AssessmentDto>> CreateAssessment([FromBody] CreateAssessmentDto createAssessmentDto)
    {
        var assessment = await _assessmentService.CreateAssessmentAsync(createAssessmentDto);
        return CreatedAtAction(nameof(GetAssessmentById), new { id = assessment.Id }, assessment);
    }

    [HttpPut("{id}")]
    // [Authorize(Roles = "Admin,QA")] // Temporarily commented for testing
    public async Task<ActionResult<AssessmentDto>> UpdateAssessment(int id, [FromBody] UpdateAssessmentDto updateAssessmentDto)
    {
        var assessment = await _assessmentService.UpdateAssessmentAsync(id, updateAssessmentDto);
        
        if (assessment == null)
            return NotFound();

        return Ok(assessment);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteAssessment(int id)
    {
        var result = await _assessmentService.DeleteAssessmentAsync(id);
        
        if (!result)
            return NotFound();

        return NoContent();
    }

    [HttpPatch("{id}/toggle-status")]
    [Authorize(Roles = "Admin,QA")]
    public async Task<ActionResult> ToggleAssessmentStatus(int id)
    {
        var result = await _assessmentService.ToggleAssessmentStatusAsync(id);
        
        if (!result)
            return NotFound();

        return Ok(new { message = "Assessment status updated successfully" });
    }

    // Question endpoints
    [HttpGet("{assessmentId}/questions")]
    public async Task<ActionResult<List<QuestionDto>>> GetQuestionsByAssessment(int assessmentId)
    {
        var questions = await _questionService.GetQuestionsByAssessmentIdAsync(assessmentId);
        return Ok(questions);
    }

    [HttpPost("{assessmentId}/questions")]
    [Authorize(Roles = "Admin,QA")]
    public async Task<ActionResult<QuestionDto>> CreateQuestion(int assessmentId, [FromBody] CreateQuestionDto createQuestionDto)
    {
        createQuestionDto.AssessmentId = assessmentId;
        var question = await _questionService.CreateQuestionAsync(createQuestionDto);
        return CreatedAtAction(nameof(GetQuestionById), new { id = question.Id }, question);
    }

    [HttpGet("questions/{id}")]
    public async Task<ActionResult<QuestionDto>> GetQuestionById(int id)
    {
        var question = await _questionService.GetQuestionByIdAsync(id);
        
        if (question == null)
            return NotFound();

        return Ok(question);
    }

    [HttpPut("questions/{id}")]
    [Authorize(Roles = "Admin,QA")]
    public async Task<ActionResult<QuestionDto>> UpdateQuestion(int id, [FromBody] UpdateQuestionDto updateQuestionDto)
    {
        var question = await _questionService.UpdateQuestionAsync(id, updateQuestionDto);
        
        if (question == null)
            return NotFound();

        return Ok(question);
    }

    [HttpDelete("questions/{id}")]
    [Authorize(Roles = "Admin,QA")]
    public async Task<ActionResult> DeleteQuestion(int id)
    {
        var result = await _questionService.DeleteQuestionAsync(id);
        
        if (!result)
            return NotFound();

        return NoContent();
    }

    private string GetCurrentUserId()
    {
        return User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";
    }
}
