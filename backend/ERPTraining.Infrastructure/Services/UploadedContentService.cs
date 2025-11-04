using ERPTraining.Core.Training.Entities;
using ERPTraining.Core.Interfaces;
using ERPTraining.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ERPTraining.Infrastructure.Services
{
    public class UploadedContentService
    {
        private readonly ApplicationDbContext _context;
        public UploadedContentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<UploadedContent>> GetAllAsync()
        {
            return await _context.UploadedContents.ToListAsync();
        }

        public async Task<UploadedContent?> GetByIdAsync(int id)
        {
            return await _context.UploadedContents.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<UploadedContent> AddAsync(UploadedContent content)
        {
            _context.UploadedContents.Add(content);
            await _context.SaveChangesAsync();
            return content;
        }
    }
}
