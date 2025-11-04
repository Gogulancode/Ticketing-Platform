// Client-side authentication API functions
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5015/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: string;
}

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  department?: string;
  role?: string;
}

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string): void {
  localStorage.setItem('token', token);
}

function removeToken(): void {
  localStorage.removeItem('token');
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

export const login = async (data: LoginData): Promise<{ user: User; token: string }> => {
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (result.token) {
    setToken(result.token);
  }
  
  return result;
};

export const register = async (data: RegisterData): Promise<{ user: User; token: string }> => {
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (result.token) {
    setToken(result.token);
  }
  
  return result;
};

export const getCurrentUser = async (): Promise<User> => {
  return apiFetch('/auth/me');
};

export const logout = (): void => {
  removeToken();
  localStorage.removeItem('user');
  // Clear any other cached data
  localStorage.removeItem('currentUser');
};

export const updateProfile = async (profileData: Partial<User>): Promise<User> => {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

export const verifyToken = (): boolean => {
  const token = getToken();
  return token !== null && token.length > 0;
};

// Default export for backward compatibility
const AuthService = {
  login,
  register,
  getCurrentUser,
  logout,
  updateProfile,
  verifyToken,
  getToken,
  setToken,
  removeToken,
};

export default AuthService;
