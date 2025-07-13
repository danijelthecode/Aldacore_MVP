from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None


class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# Project schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "planning"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    location: Optional[str] = None
    project_type: Optional[str] = None
    phases: Optional[List[dict]] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    budget: Optional[float] = None
    location: Optional[str] = None
    project_type: Optional[str] = None
    phases: Optional[List[dict]] = None


class Project(ProjectBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class ProjectWithStats(Project):
    total_forecasts: int = 0
    total_resources: int = 0
    completion_percentage: float = 0.0


# Forecast schemas
class ForecastBase(BaseModel):
    name: str
    phase: str
    week_number: int
    resource_type: str
    resource_name: str
    quantity: float
    unit: str
    confidence_score: float = 0.8
    predicted_cost: Optional[float] = None
    delivery_date: Optional[datetime] = None


class ForecastCreate(ForecastBase):
    project_id: int


class Forecast(ForecastBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Resource schemas
class ProjectResourceBase(BaseModel):
    resource_type: str
    resource_name: str
    quantity_used: float = 0.0
    quantity_planned: float
    unit: str
    cost_per_unit: Optional[float] = None
    total_cost: Optional[float] = None
    status: str = "planned"
    delivery_date: Optional[datetime] = None


class ProjectResourceCreate(ProjectResourceBase):
    project_id: int


class ProjectResourceUpdate(BaseModel):
    quantity_used: Optional[float] = None
    quantity_planned: Optional[float] = None
    cost_per_unit: Optional[float] = None
    total_cost: Optional[float] = None
    status: Optional[str] = None
    delivery_date: Optional[datetime] = None


class ProjectResource(ProjectResourceBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# Forecast request schemas
class ForecastRequest(BaseModel):
    project_id: int
    phases: List[dict]
    project_type: str = "commercial"
    timeline_weeks: int = 12


class ForecastResponse(BaseModel):
    success: bool
    message: str
    forecasts: List[Forecast]
    confidence_score: float
    generated_at: datetime


# Dashboard schemas
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    completed_projects: int
    total_forecasts: int
    upcoming_deliveries: int


class ProjectSummary(BaseModel):
    id: int
    name: str
    status: str
    completion_percentage: float
    next_delivery: Optional[datetime]
    budget_utilization: float