export interface User {
  id: number;
  email: string;
  username: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ProjectPhase {
  name: string;
  duration_weeks: number;
  phase_type: string;
  dependencies: string[];
}

export interface ProjectData {
  phases: ProjectPhase[];
  total_duration_weeks: number;
  budget?: number;
  location?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  project_data?: ProjectData;
  user_id: number;
  created_at: string;
  updated_at?: string;
}

export interface ResourceForecast {
  resource_type: string;
  resource_name: string;
  quantity: number;
  unit: string;
  week_needed: number;
  confidence_level: number;
}

export interface ForecastData {
  resources: ResourceForecast[];
  total_weeks: number;
  generated_at: string;
}

export interface Forecast {
  id: number;
  project_id: number;
  forecast_data: ForecastData;
  confidence_level: number;
  generated_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  full_name?: string;
  password: string;
}