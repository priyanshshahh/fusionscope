"""
Main FastAPI application for FusionScope backend.
Global Crisis Fusion Dashboard - Tracking climate and water shocks
propagating into geopolitical and humanitarian stress.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import router as api_router
from app.db.database import Base, engine

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="FusionScope",
    description="Global Crisis Fusion Dashboard API",
    version="1.0.0",
)

# CORS Middleware
allowed_origins = settings.allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint - API information."""
    return {
        "name": "FusionScope",
        "description": "Global Crisis Fusion Dashboard - Tracking climate and water shocks",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.on_event("startup")
async def startup_event():
    """Application startup."""
    print("🌍 FusionScope Backend Starting...")
    print(f"✓ CORS enabled for: {allowed_origins}")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown."""
    print("🛑 FusionScope Backend Shutdown")
