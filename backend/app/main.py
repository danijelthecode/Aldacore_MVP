from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import engine, get_db
from app.db.models import Base, User
from app.core.auth import get_password_hash
from app.api import auth, projects, forecasts
from sqlalchemy.orm import Session


# Database initialization
def create_tables():
    """Create database tables."""
    Base.metadata.create_all(bind=engine)


def create_test_user():
    """Create a test user for development."""
    db = next(get_db())
    try:
        # Check if test user already exists
        existing_user = db.query(User).filter(User.email == "admin@aldacore.com").first()
        if not existing_user:
            test_user = User(
                email="admin@aldacore.com",
                full_name="Admin User",
                hashed_password=get_password_hash("admin123"),
                is_active=True
            )
            db.add(test_user)
            db.commit()
            print("✅ Test user created: admin@aldacore.com / admin123")
        else:
            print("✅ Test user already exists: admin@aldacore.com / admin123")
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    print("🚀 Starting Aldacore backend...")
    create_tables()
    create_test_user()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("🛑 Shutting down Aldacore backend...")


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    version=settings.version,
    description="AI-Powered Resource Forecasting Platform for Construction & Logistics",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(forecasts.router, prefix="/api")


@app.get("/")
def read_root():
    """Root endpoint."""
    return {
        "message": "Welcome to Aldacore API",
        "version": settings.version,
        "docs": "/docs",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "aldacore-backend",
        "version": settings.version
    }


@app.get("/api/status")
def api_status():
    """API status endpoint with feature flags."""
    return {
        "api_version": settings.version,
        "features": {
            "authentication": True,
            "projects": True,
            "forecasting": True,
            "mock_ai": settings.use_mock_predictions,
        },
        "endpoints": {
            "auth": "/api/auth",
            "projects": "/api/projects", 
            "forecasts": "/api/forecasts"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug
    )