"""
API routes for FusionScope backend.
"""

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
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
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint, including data provenance."""
    provenance = {"data_source": None, "data_updated_at": None}
    try:
        metrics = MetricsService.get_global_metrics(db)
        provenance = {
            "data_source": metrics.data_source,
            "data_updated_at": (
                metrics.updated_at.isoformat() if metrics.updated_at else None
            ),
        }
    except Exception:
        pass  # health should not fail because the DB is empty
    return {"status": "healthy", "service": "FusionScope Backend", **provenance}


# Data refresh (token-protected; used by the scheduled GitHub Actions job)
@router.post("/refresh", tags=["admin"])
async def refresh_data(
    demo: bool = False, x_refresh_token: str = Header(default="")
):
    """Re-run the ETL pipeline. Requires REFRESH_TOKEN to be configured."""
    if not settings.refresh_token:
        raise HTTPException(status_code=503, detail="Refresh endpoint not configured")
    if not hmac.compare_digest(x_refresh_token, settings.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    from app.etl.refresh import run_refresh

    try:
        return run_refresh(demo=demo, reliefweb_appname=settings.reliefweb_appname)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Refresh failed: {e}")


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
