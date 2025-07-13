from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.projects import router as projects_router
from app.api.forecasts import router as forecasts_router
from app.core.config import settings

app = FastAPI(
    title="Aldacore API",
    description="AI-Powered Resource Forecasting Platform API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])
app.include_router(forecasts_router, prefix="/api/forecasts", tags=["Forecasts"])

@app.get("/")
async def root():
    return {"message": "Welcome to Aldacore API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}