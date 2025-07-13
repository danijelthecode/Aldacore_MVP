from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.models.user import User
from app.models.project import Project, Forecast
from app.schemas.project import Forecast as ForecastSchema, ForecastCreate
from app.services.forecast_service import forecast_service

router = APIRouter()

@router.post("/generate", response_model=ForecastSchema)
def generate_forecast(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Get project
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if not project.project_data:
        raise HTTPException(status_code=400, detail="Project data not available")
    
    # Generate forecast using AI service
    forecast_data = forecast_service.generate_forecast(project.project_data)
    confidence_level = forecast_service.get_confidence_level(project.project_data)
    
    # Save forecast to database
    db_forecast = Forecast(
        project_id=project_id,
        forecast_data=forecast_data.dict(),
        confidence_level=confidence_level
    )
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    
    return db_forecast

@router.get("/{project_id}", response_model=List[ForecastSchema])
def get_project_forecasts(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify project belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get all forecasts for the project
    forecasts = db.query(Forecast).filter(Forecast.project_id == project_id).all()
    return forecasts

@router.get("/{project_id}/latest", response_model=ForecastSchema)
def get_latest_forecast(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Verify project belongs to user
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get latest forecast
    forecast = db.query(Forecast).filter(
        Forecast.project_id == project_id
    ).order_by(Forecast.generated_at.desc()).first()
    
    if forecast is None:
        raise HTTPException(status_code=404, detail="No forecasts found for this project")
    
    return forecast