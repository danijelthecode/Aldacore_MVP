// User types
export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// Project types
export interface Project {
  id: number;
  name: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  location?: string;
  project_type?: string;
  phases?: ProjectPhase[];
  owner_id: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectWithStats extends Project {
  total_forecasts: number;
  total_resources: number;
  completion_percentage: number;
}

export interface ProjectCreate {
  name: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  location?: string;
  project_type?: string;
  phases?: ProjectPhase[];
}

export interface ProjectUpdate {
  name?: string;
  description?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  location?: string;
  project_type?: string;
  phases?: ProjectPhase[];
}

export interface ProjectPhase {
  name: string;
  duration_weeks: number;
  start_week: number;
  description?: string;
}

// Forecast types
export interface Forecast {
  id: number;
  project_id: number;
  name: string;
  phase: string;
  week_number: number;
  resource_type: string;
  resource_name: string;
  quantity: number;
  unit: string;
  confidence_score: number;
  predicted_cost?: number;
  delivery_date?: string;
  created_at: string;
}

export interface ForecastRequest {
  project_id: number;
  phases: ProjectPhase[];
  project_type: string;
  timeline_weeks: number;
}

export interface ForecastResponse {
  success: boolean;
  message: string;
  forecasts: Forecast[];
  confidence_score: number;
  generated_at: string;
}

// Resource types
export interface ProjectResource {
  id: number;
  project_id: number;
  resource_type: string;
  resource_name: string;
  quantity_used: number;
  quantity_planned: number;
  unit: string;
  cost_per_unit?: number;
  total_cost?: number;
  status: string;
  delivery_date?: string;
  created_at: string;
  updated_at?: string;
}

// Dashboard types
export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_forecasts: number;
  upcoming_deliveries: number;
}

export interface ProjectSummary {
  id: number;
  name: string;
  status: string;
  completion_percentage: number;
  next_delivery?: string;
  budget_utilization: number;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  full_name: string;
  password: string;
  confirmPassword: string;
}

export interface ProjectFormData {
  name: string;
  description: string;
  project_type: string;
  location: string;
  budget: number;
  start_date: string;
  end_date: string;
  phases: ProjectPhase[];
}

// UI State types
export interface LoadingState {
  [key: string]: boolean;
}

export interface ErrorState {
  [key: string]: string | null;
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface TimelineData {
  week: number;
  phase: string;
  resources: number;
  cost: number;
}

// Status types
export type ProjectStatus = 'planning' | 'active' | 'completed' | 'paused';
export type ResourceType = 'materials' | 'equipment' | 'labor';
export type ProjectType = 'residential' | 'commercial' | 'infrastructure';
export type ResourceStatus = 'planned' | 'ordered' | 'delivered' | 'used';

// Navigation types
export interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
}

// Utility types
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;