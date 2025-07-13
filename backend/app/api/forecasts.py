from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User, Project, Forecast
from app.schemas import (
    ForecastRequest, 
    ForecastResponse, 
    Forecast as ForecastSchema,
    ForecastCreate
)
from app.ml.forecasting import forecasting_engine

router = APIRouter(prefix="/forecasts", tags=["forecasts"])


@router.post("/predict", response_model=ForecastResponse)
def generate_forecast(
    request: ForecastRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate AI-powered resource forecasts for a project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == request.project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        # Generate forecasts using ML engine
        forecasts = forecasting_engine.generate_forecast(
            project_id=request.project_id,
            phases=request.phases,
            project_type=request.project_type,
            timeline_weeks=request.timeline_weeks
        )
        
        # Save forecasts to database
        saved_forecasts = []
        for forecast_data in forecasts:
            db_forecast = Forecast(
                project_id=forecast_data.project_id,
                name=forecast_data.name,
                phase=forecast_data.phase,
                week_number=forecast_data.week_number,
                resource_type=forecast_data.resource_type,
                resource_name=forecast_data.resource_name,
                quantity=forecast_data.quantity,
                unit=forecast_data.unit,
                confidence_score=forecast_data.confidence_score,
                predicted_cost=forecast_data.predicted_cost,
                delivery_date=forecast_data.delivery_date
            )
            db.add(db_forecast)
            db.commit()
            db.refresh(db_forecast)
            saved_forecasts.append(db_forecast)
        
        # Calculate overall confidence score
        if saved_forecasts:
            overall_confidence = sum(f.confidence_score for f in saved_forecasts) / len(saved_forecasts)
        else:
            overall_confidence = 0.0
        
        return ForecastResponse(
            success=True,
            message=f"Generated {len(saved_forecasts)} resource forecasts",
            forecasts=saved_forecasts,
            confidence_score=round(overall_confidence, 2),
            generated_at=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating forecasts: {str(e)}"
        )


@router.get("/", response_model=List[ForecastSchema])
def get_forecasts(
    project_id: int | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get forecasts for the current user."""
    # Get user's project IDs
    user_project_ids = [p.id for p in db.query(Project).filter(Project.owner_id == current_user.id).all()]
    
    if not user_project_ids:
        return []
    
    query = db.query(Forecast).filter(Forecast.project_id.in_(user_project_ids))
    
    if project_id:
        # Verify project ownership
        if project_id not in user_project_ids:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        query = query.filter(Forecast.project_id == project_id)
    
    forecasts = query.offset(skip).limit(limit).all()
    return forecasts


@router.get("/{forecast_id}", response_model=ForecastSchema)
def get_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific forecast by ID."""
    # Get user's project IDs
    user_project_ids = [p.id for p in db.query(Project).filter(Project.owner_id == current_user.id).all()]
    
    if not user_project_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id,
        Forecast.project_id.in_(user_project_ids)
    ).first()
    
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    return forecast


@router.delete("/{forecast_id}")
def delete_forecast(
    forecast_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a forecast."""
    # Get user's project IDs
    user_project_ids = [p.id for p in db.query(Project).filter(Project.owner_id == current_user.id).all()]
    
    if not user_project_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    forecast = db.query(Forecast).filter(
        Forecast.id == forecast_id,
        Forecast.project_id.in_(user_project_ids)
    ).first()
    
    if not forecast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Forecast not found"
        )
    
    db.delete(forecast)
    db.commit()
    return {"message": "Forecast deleted successfully"}


@router.post("/bulk-delete")
def bulk_delete_forecasts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete all forecasts for a project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Delete all forecasts for the project
    deleted_count = db.query(Forecast).filter(Forecast.project_id == project_id).delete()
    db.commit()
    
    return {"message": f"Deleted {deleted_count} forecasts"}


@router.get("/optimization/{project_id}")
def get_optimization_suggestions(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get AI-powered optimization suggestions for a project."""
    # Verify project ownership
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        optimization = forecasting_engine.predict_resource_optimization(project_id)
        return optimization
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating optimization suggestions: {str(e)}"
        )


@router.get("/analytics/{project_type}")
def get_historical_analytics(
    project_type: str,
    current_user: User = Depends(get_current_user)
):
    """Get historical analytics for similar projects."""
    try:
        analytics = forecasting_engine.analyze_historical_patterns(project_type)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving analytics: {str(e)}"
        )