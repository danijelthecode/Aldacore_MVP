from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

class ProjectPhase(BaseModel):
    name: str
    duration_weeks: int
    phase_type: str  # foundation, framing, finishing, etc.
    dependencies: List[str] = []

class ProjectData(BaseModel):
    phases: List[ProjectPhase]
    total_duration_weeks: int
    budget: Optional[float] = None
    location: Optional[str] = None

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str = "planning"
    project_data: Optional[ProjectData] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None
    project_data: Optional[ProjectData] = None

class Project(ProjectBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ResourceForecast(BaseModel):
    resource_type: str  # materials, equipment, labor
    resource_name: str
    quantity: float
    unit: str
    week_needed: int
    confidence_level: int  # 0-100

class ForecastData(BaseModel):
    resources: List[ResourceForecast]
    total_weeks: int
    generated_at: datetime

class ForecastBase(BaseModel):
    forecast_data: ForecastData
    confidence_level: int

class ForecastCreate(ForecastBase):
    project_id: int

class Forecast(ForecastBase):
    id: int
    project_id: int
    generated_at: datetime
    
    class Config:
        from_attributes = True