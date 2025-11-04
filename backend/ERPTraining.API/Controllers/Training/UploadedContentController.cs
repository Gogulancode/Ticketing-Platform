using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.Entities;
using ERPTraining.Core.Training.Entities;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadedContentController : ControllerBase
    {
        private readonly IUploadedContentService _uploadedContentService;

        public UploadedContentController(IUploadedContentService uploadedContentService)
        {
            _uploadedContentService = uploadedContentService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UploadedContent>>> GetAll()
        {
            var contents = await _uploadedContentService.GetAllAsync();
            return Ok(contents);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UploadedContent>> Get(int id)
        {
            var content = await _uploadedContentService.GetByIdAsync(id);
            if (content == null)
            {
                return NotFound();
            }
            return Ok(content);
        }

        [HttpGet("module/{moduleId}")]
        public async Task<ActionResult<IEnumerable<UploadedContent>>> GetByModule(int moduleId)
        {
            var contents = await _uploadedContentService.GetByModuleIdAsync(moduleId);
            return Ok(contents);
        }

        [HttpGet("section/{sectionId}")]
        public async Task<ActionResult<IEnumerable<UploadedContent>>> GetBySection(int sectionId)
        {
            var contents = await _uploadedContentService.GetBySectionIdAsync(sectionId);
            return Ok(contents);
        }

        [HttpPost]
        // [Authorize] // Temporarily commented for testing
        public async Task<ActionResult<UploadedContent>> Upload([FromBody] CreateUploadedContentDto content)
        {
            try
            {
                // Map DTO to entity
                var uploadedContent = new UploadedContent
                {
                    Title = content.Title,
                    Description = content.Description,
                    Type = (ERPTraining.Core.Training.Entities.ContentType)content.Type,
                    FilePath = content.FilePath,
                    FileName = content.FileName,
                    FileSize = content.FileSize,
                    ContentType = content.ContentType, // string to string
                    ModuleId = content.ModuleId,
                    SectionId = content.SectionId,
                    LessonId = content.LessonId,
                    UploadedById = content.UploadedById,
                    Tags = content.Tags,
                    AccessRoles = content.AccessRoles,
                    ScribeLink = content.ScribeLink,
                    VideoUrl = content.VideoUrl,
                    IsActive = true
                };

                var result = await _uploadedContentService.AddAsync(uploadedContent);
                return CreatedAtAction(nameof(Get), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Error uploading content: {ex.Message}");
            }
        }
    }
}
