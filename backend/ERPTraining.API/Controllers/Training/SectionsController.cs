using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ERPTraining.Core.DTOs;
using ERPTraining.Core.Interfaces;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace ERPTraining.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize] // Temporarily commented for testing
    public class SectionsController : ControllerBase
    {
        private readonly ISectionService _sectionService;

        public SectionsController(ISectionService sectionService)
        {
            _sectionService = sectionService;
        }

        /// <summary>
        /// Get all sections
        /// </summary>
        [HttpGet]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<IEnumerable<SectionDto>>> GetAllSections()
        {
            var sections = await _sectionService.GetAllSectionsAsync();
            return Ok(sections);
        }

        /// <summary>
        /// Get sections by module ID
        /// </summary>
        [HttpGet("module/{moduleId}")]
        [AllowAnonymous] // Temporarily allow anonymous access for testing
        public async Task<ActionResult<IEnumerable<SectionDto>>> GetSectionsByModule(int moduleId)
        {
            try
            {
                Console.WriteLine($"Attempting to fetch sections for module {moduleId}");
                var sections = await _sectionService.GetSectionsByModuleAsync(moduleId);
                Console.WriteLine($"Query executed. Sections found: {sections?.Count() ?? 0}");
                
                if (sections == null || !sections.Any())
                {
                    Console.WriteLine($"No sections found for module {moduleId}");
                    return NotFound($"No sections found for module {moduleId}");
                }
                return Ok(sections);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetSectionsByModule: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, $"Error getting sections: {ex.Message}");
            }
        }

        /// <summary>
        /// Get section by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<SectionDto>> GetSectionById(int id)
        {
            var section = await _sectionService.GetSectionByIdAsync(id);
            
            if (section == null)
                return NotFound();
            
            return Ok(section);
        }

        /// <summary>
        /// Create a new section
        /// </summary>
        [HttpPost]
        // [Authorize(Roles = "Admin,Super Admin")] // Temporarily commented for testing
        public async Task<ActionResult<SectionDto>> CreateSection([FromBody] CreateSectionDto createSectionDto)
        {
            var section = await _sectionService.CreateSectionAsync(createSectionDto);
            return CreatedAtAction(nameof(GetSectionById), new { id = section.Id }, section);
        }

        /// <summary>
        /// Update an existing section
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Super Admin")]
        public async Task<ActionResult<SectionDto>> UpdateSection(int id, [FromBody] UpdateSectionDto updateSectionDto)
        {
            var section = await _sectionService.UpdateSectionAsync(id, updateSectionDto);
            
            if (section == null)
                return NotFound();
            
            return Ok(section);
        }

        /// <summary>
        /// Delete a section
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Super Admin")]
        public async Task<ActionResult> DeleteSection(int id)
        {
            var success = await _sectionService.DeleteSectionAsync(id);
            
            if (!success)
                return NotFound();
            
            return NoContent();
        }

        /// <summary>
        /// Check if section exists
        /// </summary>
        [HttpGet("{id}/exists")]
        public async Task<ActionResult<bool>> SectionExists(int id)
        {
            var exists = await _sectionService.SectionExistsAsync(id);
            return Ok(new { exists });
        }
    }
}
