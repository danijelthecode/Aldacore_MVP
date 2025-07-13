import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
from app.schemas import Forecast, ForecastCreate


class MockForecastingEngine:
    """
    Mock forecasting engine that simulates AI-powered resource predictions.
    This can be easily replaced with real ML models later.
    """
    
    def __init__(self):
        # Resource templates for different project phases
        self.phase_resources = {
            "foundation": {
                "materials": [
                    {"name": "Concrete", "unit": "cubic_yards", "base_quantity": 50},
                    {"name": "Rebar", "unit": "tons", "base_quantity": 5},
                    {"name": "Gravel", "unit": "tons", "base_quantity": 20},
                    {"name": "Forms", "unit": "sq_ft", "base_quantity": 200},
                ],
                "equipment": [
                    {"name": "Excavator", "unit": "hours", "base_quantity": 40},
                    {"name": "Concrete Mixer", "unit": "hours", "base_quantity": 16},
                    {"name": "Compactor", "unit": "hours", "base_quantity": 8},
                ],
                "labor": [
                    {"name": "Foundation Crew", "unit": "hours", "base_quantity": 160},
                    {"name": "Equipment Operator", "unit": "hours", "base_quantity": 80},
                ]
            },
            "framing": {
                "materials": [
                    {"name": "Lumber 2x4", "unit": "board_feet", "base_quantity": 2000},
                    {"name": "Lumber 2x8", "unit": "board_feet", "base_quantity": 800},
                    {"name": "Plywood", "unit": "sheets", "base_quantity": 100},
                    {"name": "Nails", "unit": "lbs", "base_quantity": 50},
                ],
                "equipment": [
                    {"name": "Crane", "unit": "hours", "base_quantity": 24},
                    {"name": "Nail Gun", "unit": "hours", "base_quantity": 80},
                ],
                "labor": [
                    {"name": "Framing Crew", "unit": "hours", "base_quantity": 200},
                    {"name": "Crane Operator", "unit": "hours", "base_quantity": 24},
                ]
            },
            "finishing": {
                "materials": [
                    {"name": "Drywall", "unit": "sheets", "base_quantity": 150},
                    {"name": "Paint", "unit": "gallons", "base_quantity": 40},
                    {"name": "Flooring", "unit": "sq_ft", "base_quantity": 1500},
                    {"name": "Electrical Wire", "unit": "feet", "base_quantity": 2000},
                ],
                "equipment": [
                    {"name": "Lift", "unit": "hours", "base_quantity": 32},
                    {"name": "Paint Sprayer", "unit": "hours", "base_quantity": 20},
                ],
                "labor": [
                    {"name": "Finishing Crew", "unit": "hours", "base_quantity": 240},
                    {"name": "Electrician", "unit": "hours", "base_quantity": 80},
                    {"name": "Painter", "unit": "hours", "base_quantity": 60},
                ]
            }
        }
        
        # Cost multipliers by resource type
        self.cost_multipliers = {
            "materials": {"min": 50, "max": 500},
            "equipment": {"min": 25, "max": 150},
            "labor": {"min": 20, "max": 80}
        }
    
    def generate_forecast(
        self, 
        project_id: int, 
        phases: List[Dict[str, Any]], 
        project_type: str = "commercial", 
        timeline_weeks: int = 12
    ) -> List[Forecast]:
        """
        Generate mock resource forecasts for a project.
        """
        forecasts = []
        
        # Project type multiplier
        type_multiplier = {
            "residential": 0.7,
            "commercial": 1.0,
            "infrastructure": 1.5
        }.get(project_type, 1.0)
        
        # Generate forecasts for each phase
        for phase_info in phases:
            phase_name = phase_info.get("name", "unknown").lower()
            phase_duration = phase_info.get("duration_weeks", 4)
            start_week = phase_info.get("start_week", 1)
            
            # Get resources for this phase
            phase_resources = self.phase_resources.get(phase_name, self.phase_resources["finishing"])
            
            # Generate forecasts for each resource type
            for resource_type, resources in phase_resources.items():
                for resource in resources:
                    # Calculate quantity with some randomness
                    base_qty = resource["base_quantity"]
                    quantity = base_qty * type_multiplier * random.uniform(0.8, 1.2)
                    
                    # Calculate cost
                    cost_range = self.cost_multipliers[resource_type]
                    cost_per_unit = random.uniform(cost_range["min"], cost_range["max"])
                    predicted_cost = quantity * cost_per_unit
                    
                    # Calculate delivery date (start of phase + some lead time)
                    lead_time_days = random.randint(3, 10)
                    delivery_date = datetime.now() + timedelta(
                        weeks=start_week, days=lead_time_days
                    )
                    
                    # Generate confidence score
                    confidence = self._calculate_confidence_score(phase_name, resource_type)
                    
                    # Create forecast
                    forecast = Forecast(
                        id=0,  # Will be set by database
                        project_id=project_id,
                        name=f"{phase_name.title()} {resource['name']}",
                        phase=phase_name,
                        week_number=start_week,
                        resource_type=resource_type,
                        resource_name=resource["name"],
                        quantity=round(quantity, 2),
                        unit=resource["unit"],
                        confidence_score=confidence,
                        predicted_cost=round(predicted_cost, 2),
                        delivery_date=delivery_date,
                        created_at=datetime.now()
                    )
                    
                    forecasts.append(forecast)
        
        return forecasts
    
    def _calculate_confidence_score(self, phase: str, resource_type: str) -> float:
        """Calculate a mock confidence score based on phase and resource type."""
        base_confidence = {
            "foundation": 0.9,
            "framing": 0.85,
            "finishing": 0.75
        }.get(phase, 0.8)
        
        type_adjustment = {
            "materials": 0.05,
            "equipment": -0.05,
            "labor": -0.1
        }.get(resource_type, 0)
        
        confidence = base_confidence + type_adjustment + random.uniform(-0.1, 0.1)
        return max(0.5, min(0.99, confidence))
    
    def predict_resource_optimization(self, project_id: int) -> Dict[str, Any]:
        """
        Generate mock optimization suggestions for resource scheduling.
        """
        suggestions = [
            "Consider ordering concrete 3 days earlier to avoid weather delays",
            "Lumber delivery can be split into 2 batches to reduce storage costs",
            "Schedule equipment rental to overlap phases for cost savings",
            "Labor crew size can be optimized for 15% efficiency gain"
        ]
        
        return {
            "optimization_score": round(random.uniform(0.7, 0.95), 2),
            "potential_savings": round(random.uniform(5000, 25000), 2),
            "suggestions": random.sample(suggestions, k=random.randint(2, 4)),
            "confidence": round(random.uniform(0.8, 0.95), 2)
        }
    
    def analyze_historical_patterns(self, project_type: str) -> Dict[str, Any]:
        """
        Generate mock historical analysis data.
        """
        return {
            "similar_projects": random.randint(15, 50),
            "average_timeline": random.randint(8, 16),
            "cost_variance": round(random.uniform(0.05, 0.2), 2),
            "common_delays": [
                "Weather conditions",
                "Material delivery delays",
                "Permit approvals"
            ],
            "success_rate": round(random.uniform(0.85, 0.95), 2)
        }


# Global instance
forecasting_engine = MockForecastingEngine()