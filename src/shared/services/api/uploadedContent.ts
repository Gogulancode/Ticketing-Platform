const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function apiFetch(path: string, options: { [key: string]: any } = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export interface UploadedContent {
  id?: number;
  title: string;
  description: string;
  content?: string;
  type: 'Document' | 'Video' | 'Image' | 'Interactive';
  filePath?: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
  moduleId: number;
  sectionId?: number;
  lessonId?: number;
  uploadedById?: string;
  tags: string[];
  accessRoles: string[];
  scribeLink?: string;
  videoUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const uploadContent = async (content: UploadedContent): Promise<UploadedContent> => {
  // Convert string type to enum number
  const getTypeNumber = (type: string): number => {
    const typeMap: { [key: string]: number } = {
      'Document': 0,
      'Video': 1,
      'Image': 2,
      'Interactive': 3
    };
    return typeMap[type] || 0;
  };

  return apiFetch('/uploadedcontent', {
    method: 'POST',
    body: JSON.stringify({
      title: content.title,
      description: content.description,
      content: content.content || content.description,
      type: getTypeNumber(content.type),
      filePath: content.filePath || '',
      fileName: content.fileName || '',
      fileSize: content.fileSize || 0,
      contentType: content.contentType || 'application/json',
      moduleId: parseInt(content.moduleId.toString()),
      sectionId: content.sectionId ? parseInt(content.sectionId.toString()) : null,
      lessonId: content.lessonId ? parseInt(content.lessonId.toString()) : null,
      uploadedById: content.uploadedById || 'current-user',
      tags: content.tags || [],
      accessRoles: content.accessRoles || [],
      scribeLink: content.scribeLink || null,
      videoUrl: content.videoUrl || null,
      isActive: content.isActive !== false, // Default to true
    }),
  });
};

export const getUploadedContent = async (): Promise<UploadedContent[]> => {
  return apiFetch('/uploadedcontent');
};

export const getUploadedContentByModule = async (moduleId: number): Promise<UploadedContent[]> => {
  return apiFetch(`/uploadedcontent/module/${moduleId}`);
};

export const getUploadedContentBySection = async (sectionId: number): Promise<UploadedContent[]> => {
  return apiFetch(`/uploadedcontent/section/${sectionId}`);
};
