// Client-side assessments API functions
const API_BASE = 'http://localhost:5016/api';

interface Assessment {
  id: string;
  title: string;
  description: string;
  moduleId?: number;
  sectionId?: number;
  passingScore: number;
  timeLimit: number;
  maxAttempts: number;
  isRequired: boolean;
  questions?: Question[];
}

interface Question {
  id: string;
  type: string;
  questionText: string;
  options: string[];
  correctAnswers: string[];
  explanation?: string;
  points: number;
}

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
  
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const getAssessments = async (): Promise<Assessment[]> => {
  return apiFetch('/assessments');
};

export const getAssessment = async (assessmentId: string): Promise<Assessment> => {
  return apiFetch(`/assessments/${assessmentId}`);
};

export const createAssessment = async (assessmentData: Partial<Assessment>): Promise<Assessment> => {
  return apiFetch('/assessments', {
    method: 'POST',
    body: JSON.stringify(assessmentData),
  });
};

export const updateAssessment = async (assessmentId: string, assessmentData: Partial<Assessment>): Promise<Assessment> => {
  return apiFetch(`/assessments/${assessmentId}`, {
    method: 'PUT',
    body: JSON.stringify(assessmentData),
  });
};

export const deleteAssessment = async (assessmentId: string): Promise<void> => {
  return apiFetch(`/assessments/${assessmentId}`, {
    method: 'DELETE',
  });
};

export const getAssessmentQuestions = async (assessmentId: string): Promise<Question[]> => {
  return apiFetch(`/assessments/${assessmentId}/questions`);
};

export const createQuestion = async (assessmentId: string, questionData: Partial<Question>): Promise<Question> => {
  return apiFetch(`/assessments/${assessmentId}/questions`, {
    method: 'POST',
    body: JSON.stringify(questionData),
  });
};
