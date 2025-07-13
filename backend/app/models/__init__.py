from .user import User
from .project import Project, Forecast

# Update User model to include relationships
from sqlalchemy.orm import relationship
User.projects = relationship("Project", back_populates="user")