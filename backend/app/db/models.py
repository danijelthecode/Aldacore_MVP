from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text)
    status = Column(String, default="planning")  # planning, active, completed, paused
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    budget = Column(Float)
    location = Column(String)
    project_type = Column(String)  # residential, commercial, infrastructure
    phases = Column(JSON)  # Array of project phases
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    owner_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    owner = relationship("User", back_populates="projects")
    forecasts = relationship("Forecast", back_populates="project")
    resources = relationship("ProjectResource", back_populates="project")


class Forecast(Base):
    __tablename__ = "forecasts"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    phase = Column(String, nullable=False)  # foundation, framing, finishing, etc.
    week_number = Column(Integer, nullable=False)
    resource_type = Column(String, nullable=False)  # materials, equipment, labor
    resource_name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # cubic_yards, tons, hours, etc.
    confidence_score = Column(Float, default=0.8)
    predicted_cost = Column(Float)
    delivery_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign keys
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # Relationships
    project = relationship("Project", back_populates="forecasts")


class ProjectResource(Base):
    __tablename__ = "project_resources"
    
    id = Column(Integer, primary_key=True, index=True)
    resource_type = Column(String, nullable=False)
    resource_name = Column(String, nullable=False)
    quantity_used = Column(Float, default=0.0)
    quantity_planned = Column(Float, nullable=False)
    unit = Column(String, nullable=False)
    cost_per_unit = Column(Float)
    total_cost = Column(Float)
    status = Column(String, default="planned")  # planned, ordered, delivered, used
    delivery_date = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign keys
    project_id = Column(Integer, ForeignKey("projects.id"))
    
    # Relationships
    project = relationship("Project", back_populates="resources")