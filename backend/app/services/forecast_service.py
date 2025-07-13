import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.schemas.project import ProjectData, ProjectPhase, ResourceForecast, ForecastData

class MockForecastService:
    """Mock AI service for resource forecasting"""
    
    # Mock resource patterns for different phase types
    RESOURCE_PATTERNS = {
        "foundation": {
            "materials": [
                {"name": "Concrete", "unit": "cubic yards", "base_rate": 50},
                {"name": "Rebar", "unit": "tons", "base_rate": 2},
                {"name": "Formwork", "unit": "sq ft", "base_rate": 100}
            ],
            "equipment": [
                {"name": "Excavator", "unit": "hours", "base_rate": 8},
                {"name": "Concrete Pump", "unit": "hours", "base_rate": 4}
            ]
        },
        "framing": {
            "materials": [
                {"name": "Lumber", "unit": "board feet", "base_rate": 500},
                {"name": "Plywood", "unit": "sheets", "base_rate": 20},
                {"name": "Nails", "unit": "lbs", "base_rate": 50}
            ],
            "equipment": [
                {"name": "Crane", "unit": "hours", "base_rate": 6},
                {"name": "Forklift", "unit": "hours", "base_rate": 4}
            ]
        },
        "finishing": {
            "materials": [
                {"name": "Drywall", "unit": "sheets", "base_rate": 30},
                {"name": "Paint", "unit": "gallons", "base_rate": 15},
                {"name": "Flooring", "unit": "sq ft", "base_rate": 200}
            ],
            "equipment": [
                {"name": "Scaffolding", "unit": "days", "base_rate": 5},
                {"name": "Paint Sprayer", "unit": "hours", "base_rate": 3}
            ]
        },
        "electrical": {
            "materials": [
                {"name": "Wire", "unit": "feet", "base_rate": 1000},
                {"name": "Conduit", "unit": "feet", "base_rate": 200},
                {"name": "Fixtures", "unit": "pieces", "base_rate": 10}
            ],
            "equipment": [
                {"name": "Lift", "unit": "hours", "base_rate": 4},
                {"name": "Tools", "unit": "sets", "base_rate": 2}
            ]
        },
        "plumbing": {
            "materials": [
                {"name": "Pipe", "unit": "feet", "base_rate": 300},
                {"name": "Fittings", "unit": "pieces", "base_rate": 50},
                {"name": "Fixtures", "unit": "pieces", "base_rate": 8}
            ],
            "equipment": [
                {"name": "Pipe Threader", "unit": "hours", "base_rate": 2},
                {"name": "Welder", "unit": "hours", "base_rate": 3}
            ]
        }
    }
    
    def generate_forecast(self, project_data: ProjectData) -> ForecastData:
        """Generate resource forecast for a project"""
        resources = []
        current_week = 1
        
        for phase in project_data.phases:
            phase_resources = self._generate_phase_resources(phase, current_week)
            resources.extend(phase_resources)
            current_week += phase.duration_weeks
        
        return ForecastData(
            resources=resources,
            total_weeks=project_data.total_duration_weeks,
            generated_at=datetime.now()
        )
    
    def _generate_phase_resources(self, phase: ProjectPhase, start_week: int) -> List[ResourceForecast]:
        """Generate resources for a specific phase"""
        resources = []
        phase_pattern = self.RESOURCE_PATTERNS.get(phase.phase_type, {})
        
        # Generate materials
        for material in phase_pattern.get("materials", []):
            for week in range(start_week, start_week + phase.duration_weeks):
                # Add some randomness to make it realistic
                quantity = material["base_rate"] * random.uniform(0.8, 1.2)
                confidence = random.randint(75, 95)
                
                resources.append(ResourceForecast(
                    resource_type="materials",
                    resource_name=material["name"],
                    quantity=round(quantity, 2),
                    unit=material["unit"],
                    week_needed=week,
                    confidence_level=confidence
                ))
        
        # Generate equipment
        for equipment in phase_pattern.get("equipment", []):
            for week in range(start_week, start_week + phase.duration_weeks):
                quantity = equipment["base_rate"] * random.uniform(0.9, 1.1)
                confidence = random.randint(80, 98)
                
                resources.append(ResourceForecast(
                    resource_type="equipment",
                    resource_name=equipment["name"],
                    quantity=round(quantity, 2),
                    unit=equipment["unit"],
                    week_needed=week,
                    confidence_level=confidence
                ))
        
        return resources
    
    def get_confidence_level(self, project_data: ProjectData) -> int:
        """Calculate overall confidence level for the forecast"""
        # Mock confidence calculation based on project complexity
        total_phases = len(project_data.phases)
        total_duration = project_data.total_duration_weeks
        
        # More phases and longer duration = lower confidence
        base_confidence = 90
        phase_penalty = (total_phases - 1) * 2
        duration_penalty = max(0, (total_duration - 20) * 0.5)
        
        confidence = base_confidence - phase_penalty - duration_penalty
        return max(60, min(95, int(confidence)))

# Global instance
forecast_service = MockForecastService()