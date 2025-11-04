using ERPTraining.Core.Entities;

using ERPTraining.Core.Training.Entities;

namespace ERPTraining.Core.Interfaces;

public interface IUploadedContentService
{
    Task<List<UploadedContent>> GetAllAsync();
    Task<UploadedContent?> GetByIdAsync(int id);
    Task<UploadedContent> AddAsync(UploadedContent content);
    Task<List<UploadedContent>> GetByModuleIdAsync(int moduleId);
    Task<List<UploadedContent>> GetBySectionIdAsync(int sectionId);
}
