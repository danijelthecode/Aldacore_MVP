import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import {
  User,
  UserCreate,
  LoginRequest,
  Token,
  Project,
  ProjectWithStats,
  ProjectCreate,
  ProjectUpdate,
  Forecast,
  ForecastRequest,
  ForecastResponse,
  ProjectResource,
  DashboardStats,
  ApiResponse
} from '../types';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
class TokenManager {
  private static TOKEN_KEY = 'aldacore_token';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken();
    if (token && TokenManager.isTokenValid()) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      TokenManager.removeToken();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API service classes
class AuthService {
  async login(credentials: LoginRequest): Promise<Token> {
    const response = await apiClient.post<Token>('/api/auth/login', credentials);
    const token = response.data;
    TokenManager.setToken(token.access_token);
    return token;
  }

  async register(userData: UserCreate): Promise<User> {
    const response = await apiClient.post<User>('/api/auth/register', userData);
    return response.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/api/auth/me');
    return response.data;
  }

  logout(): void {
    TokenManager.removeToken();
  }

  isAuthenticated(): boolean {
    return TokenManager.isTokenValid();
  }
}

class ProjectService {
  async getProjects(): Promise<ProjectWithStats[]> {
    const response = await apiClient.get<ProjectWithStats[]>('/api/projects/');
    return response.data;
  }

  async getProject(id: number): Promise<ProjectWithStats> {
    const response = await apiClient.get<ProjectWithStats>(`/api/projects/${id}`);
    return response.data;
  }

  async createProject(projectData: ProjectCreate): Promise<Project> {
    const response = await apiClient.post<Project>('/api/projects/', projectData);
    return response.data;
  }

  async updateProject(id: number, projectData: ProjectUpdate): Promise<Project> {
    const response = await apiClient.put<Project>(`/api/projects/${id}`, projectData);
    return response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await apiClient.delete(`/api/projects/${id}`);
  }

  async getProjectForecasts(id: number): Promise<Forecast[]> {
    const response = await apiClient.get<Forecast[]>(`/api/projects/${id}/forecasts`);
    return response.data;
  }

  async getProjectResources(id: number): Promise<ProjectResource[]> {
    const response = await apiClient.get<ProjectResource[]>(`/api/projects/${id}/resources`);
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await apiClient.get<DashboardStats>('/api/projects/dashboard/stats');
    return response.data;
  }
}

class ForecastService {
  async generateForecast(request: ForecastRequest): Promise<ForecastResponse> {
    const response = await apiClient.post<ForecastResponse>('/api/forecasts/predict', request);
    return response.data;
  }

  async getForecasts(projectId?: number): Promise<Forecast[]> {
    const params = projectId ? { project_id: projectId } : {};
    const response = await apiClient.get<Forecast[]>('/api/forecasts/', { params });
    return response.data;
  }

  async getForecast(id: number): Promise<Forecast> {
    const response = await apiClient.get<Forecast>(`/api/forecasts/${id}`);
    return response.data;
  }

  async deleteForecast(id: number): Promise<void> {
    await apiClient.delete(`/api/forecasts/${id}`);
  }

  async bulkDeleteForecasts(projectId: number): Promise<void> {
    await apiClient.post('/api/forecasts/bulk-delete', { project_id: projectId });
  }

  async getOptimizationSuggestions(projectId: number): Promise<any> {
    const response = await apiClient.get(`/api/forecasts/optimization/${projectId}`);
    return response.data;
  }

  async getHistoricalAnalytics(projectType: string): Promise<any> {
    const response = await apiClient.get(`/api/forecasts/analytics/${projectType}`);
    return response.data;
  }
}

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || error.response.data?.message || error.message;
    return new ApiError(message, error.response.status, error.response.data);
  } else if (error.request) {
    // Request was made but no response received
    return new ApiError('Network error - please check your connection');
  } else {
    // Something else happened
    return new ApiError(error.message || 'An unexpected error occurred');
  }
};

// Health check utility
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

// Export service instances
export const authService = new AuthService();
export const projectService = new ProjectService();
export const forecastService = new ForecastService();

// Export types and utilities
export { TokenManager };
export default apiClient;