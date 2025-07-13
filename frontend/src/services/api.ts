import axios from 'axios';
import { 
  User, 
  Project, 
  Forecast, 
  AuthResponse, 
  LoginCredentials, 
  RegisterData,
  ProjectData 
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },
};

// Projects API
export const projectsAPI = {
  getProjects: async (): Promise<Project[]> => {
    const response = await api.get('/api/projects');
    return response.data;
  },

  getProject: async (id: number): Promise<Project> => {
    const response = await api.get(`/api/projects/${id}`);
    return response.data;
  },

  createProject: async (project: Partial<Project>): Promise<Project> => {
    const response = await api.post('/api/projects', project);
    return response.data;
  },

  updateProject: async (id: number, project: Partial<Project>): Promise<Project> => {
    const response = await api.put(`/api/projects/${id}`, project);
    return response.data;
  },

  deleteProject: async (id: number): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },
};

// Forecasts API
export const forecastsAPI = {
  generateForecast: async (projectId: number): Promise<Forecast> => {
    const response = await api.post(`/api/forecasts/generate?project_id=${projectId}`);
    return response.data;
  },

  getProjectForecasts: async (projectId: number): Promise<Forecast[]> => {
    const response = await api.get(`/api/forecasts/${projectId}`);
    return response.data;
  },

  getLatestForecast: async (projectId: number): Promise<Forecast> => {
    const response = await api.get(`/api/forecasts/${projectId}/latest`);
    return response.data;
  },
};

export default api;