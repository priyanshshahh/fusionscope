"""
Main FastAPI application for FusionScope backend.
Global Crisis Fusion Dashboard - Tracking climate and water shocks
propagating into geopolitical and humanitarian stress.
"""

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api.routes import router as api_router
from app.db.database import Base, engine

logger = logging.getLogger("fusionscope")

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


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """Log the real error server-side; return a generic message to the client.

    Prevents leaking exception text (connection strings, upstream URLs,
    internal field names) into client-visible responses. FastAPI's own
    HTTPException handling is unaffected — those still return their own detail.
    """
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


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
