from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.auth import get_current_user
from app.db.database import get_db
from app.db.models import User, Project, Forecast, ProjectResource
from app.schemas import (
    Project as ProjectSchema, 
    ProjectCreate, 
    ProjectUpdate,
    ProjectWithStats,
    ProjectSummary,
    DashboardStats
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("/", response_model=List[ProjectWithStats])
def get_projects(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all projects for the current user."""
    projects = db.query(Project).filter(Project.owner_id == current_user.id).offset(skip).limit(limit).all()
    
    # Add stats for each project
    projects_with_stats = []
    for project in projects:
        forecast_count = db.query(Forecast).filter(Forecast.project_id == project.id).count()
        resource_count = db.query(ProjectResource).filter(ProjectResource.project_id == project.id).count()
        
        # Calculate completion percentage (mock calculation)
        completion_percentage = min(100.0, (forecast_count * 10) + (resource_count * 5))
        
        project_data = ProjectWithStats(
            **project.__dict__,
            total_forecasts=forecast_count,
            total_resources=resource_count,
            completion_percentage=completion_percentage
        )
        projects_with_stats.append(project_data)
    
    return projects_with_stats


@router.post("/", response_model=ProjectSchema)
def create_project(
    project: ProjectCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project."""
    db_project = Project(
        **project.dict(),
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/{project_id}", response_model=ProjectWithStats)
def get_project(
    project_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific project by ID."""
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Add stats
    forecast_count = db.query(Forecast).filter(Forecast.project_id == project.id).count()
    resource_count = db.query(ProjectResource).filter(ProjectResource.project_id == project.id).count()
    completion_percentage = min(100.0, (forecast_count * 10) + (resource_count * 5))
    
    return ProjectWithStats(
        **project.__dict__,
        total_forecasts=forecast_count,
        total_resources=resource_count,
        completion_percentage=completion_percentage
    )


@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(
    project_id: int,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a project."""
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update only provided fields
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a project."""
    project = db.query(Project).filter(
        Project.id == project_id, 
        Project.owner_id == current_user.id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}


@router.get("/{project_id}/forecasts")
def get_project_forecasts(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all forecasts for a project."""
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
    
    forecasts = db.query(Forecast).filter(Forecast.project_id == project_id).all()
    return forecasts


@router.get("/{project_id}/resources")
def get_project_resources(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all resources for a project."""
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
    
    resources = db.query(ProjectResource).filter(ProjectResource.project_id == project_id).all()
    return resources


@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics for the current user."""
    total_projects = db.query(Project).filter(Project.owner_id == current_user.id).count()
    active_projects = db.query(Project).filter(
        Project.owner_id == current_user.id, 
        Project.status == "active"
    ).count()
    completed_projects = db.query(Project).filter(
        Project.owner_id == current_user.id, 
        Project.status == "completed"
    ).count()
    
    # Get total forecasts for user's projects
    user_project_ids = [p.id for p in db.query(Project).filter(Project.owner_id == current_user.id).all()]
    total_forecasts = db.query(Forecast).filter(Forecast.project_id.in_(user_project_ids)).count() if user_project_ids else 0
    
    # Mock upcoming deliveries count
    upcoming_deliveries = min(total_forecasts, 15)
    
    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        completed_projects=completed_projects,
        total_forecasts=total_forecasts,
        upcoming_deliveries=upcoming_deliveries
    )