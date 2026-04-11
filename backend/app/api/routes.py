"""
API routes for FusionScope backend.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import CountryService, AlertService, FeedService, MetricsService
from app.schemas.country import (
    CountryResponse,
    AlertResponse,
    FeedItemResponse,
    GlobalMetricsResponse,
    SummaryResponse,
)
from typing import List

router = APIRouter(prefix="/api", tags=["api"])


# Health check
@router.get("/health", tags=["health"])
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "FusionScope Backend"}


# Global Metrics
@router.get("/global-metrics", response_model=GlobalMetricsResponse)
async def get_global_metrics(db: Session = Depends(get_db)):
    """Get global fusion dashboard metrics."""
    try:
        metrics = MetricsService.get_global_metrics(db)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Countries
@router.get("/countries", response_model=List[CountryResponse])
async def get_countries(db: Session = Depends(get_db)):
    """Get all countries with their risk profiles."""
    try:
        countries = CountryService.get_all_countries(db)
        return countries
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/country/{code}", response_model=CountryResponse)
async def get_country(code: str, db: Session = Depends(get_db)):
    """Get a specific country by country code."""
    try:
        country = CountryService.get_country_by_code(db, code.upper())
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        return country
    except HTTPException:
        raise
    except Exception as e:  
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/summary/{code}", response_model=SummaryResponse)
async def get_country_summary(code: str, db: Session = Depends(get_db)):
    """Get AI summary for a country."""
    try:
        summary = CountryService.get_country_summary(db, code.upper())
        if not summary:
            raise HTTPException(status_code=404, detail="Country not found")
        return summary
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Alerts
@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(db: Session = Depends(get_db)):
    """Get all active alerts."""
    try:
        alerts = AlertService.get_all_alerts(db)
        return alerts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Feed
@router.get("/feed", response_model=List[FeedItemResponse])
async def get_feed(limit: int = 100, db: Session = Depends(get_db)):
    """Get global intelligence feed items."""
    try:
        feed = FeedService.get_all_feed_items(db, limit=limit)
        return feed
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Country-specific endpoints
@router.get("/country/{code}/alerts", response_model=List[AlertResponse])
async def get_country_alerts(code: str, db: Session = Depends(get_db)):
    """Get alerts for a specific country."""
    try:
        # Verify country exists
        country = CountryService.get_country_by_code(db, code.upper())
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        alerts = AlertService.get_alerts_by_country(db, code.upper())
        return alerts
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/country/{code}/feed", response_model=List[FeedItemResponse])
async def get_country_feed(code: str, db: Session = Depends(get_db)):
    """Get feed items for a specific country."""
    try:
        # Verify country exists
        country = CountryService.get_country_by_code(db, code.upper())
        if not country:
            raise HTTPException(status_code=404, detail="Country not found")
        
        feed = FeedService.get_feed_by_country(db, code.upper())
        return feed
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
