"""
API routes for FusionScope backend.
"""

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db
from app.services import (
    CountryService,
    AlertService,
    FeedService,
    HistoryService,
    MetricsService,
)
from app.schemas.country import (
    CountryResponse,
    AlertResponse,
    FeedItemResponse,
    GlobalMetricsResponse,
    HistoryPoint,
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

    # Any failure is caught by the shared handler in main.py, which logs the
    # real exception server-side and returns a generic message to the client.
    return run_refresh(demo=demo, reliefweb_appname=settings.reliefweb_appname)


# Global Metrics
@router.get("/global-metrics", response_model=GlobalMetricsResponse)
async def get_global_metrics(db: Session = Depends(get_db)):
    """Get global fusion dashboard metrics."""
    return MetricsService.get_global_metrics(db)


# Countries
@router.get("/countries", response_model=List[CountryResponse])
async def get_countries(db: Session = Depends(get_db)):
    """Get all countries with their risk profiles."""
    return CountryService.get_all_countries(db)


@router.get("/country/{code}", response_model=CountryResponse)
async def get_country(code: str, db: Session = Depends(get_db)):
    """Get a specific country by country code."""
    country = CountryService.get_country_by_code(db, code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return country


@router.get("/summary/{code}", response_model=SummaryResponse)
async def get_country_summary(code: str, db: Session = Depends(get_db)):
    """Get the generated situation summary for a country."""
    summary = CountryService.get_country_summary(db, code.upper())
    if not summary:
        raise HTTPException(status_code=404, detail="Country not found")
    return summary


# Alerts
@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(db: Session = Depends(get_db)):
    """Get all active alerts."""
    return AlertService.get_all_alerts(db)


# Feed
@router.get("/feed", response_model=List[FeedItemResponse])
async def get_feed(limit: int = 100, db: Session = Depends(get_db)):
    """Get global intelligence feed items."""
    return FeedService.get_all_feed_items(db, limit=limit)


# Historical score trend (accumulated across refreshes)
@router.get("/history/{code}", response_model=List[HistoryPoint])
async def get_country_history(code: str, db: Session = Depends(get_db)):
    """Get the accumulated fusion-score history for a specific country."""
    country = CountryService.get_country_by_code(db, code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return HistoryService.get_country_history(db, code.upper())


# Country-specific endpoints
@router.get("/country/{code}/alerts", response_model=List[AlertResponse])
async def get_country_alerts(code: str, db: Session = Depends(get_db)):
    """Get alerts for a specific country."""
    country = CountryService.get_country_by_code(db, code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return AlertService.get_alerts_by_country(db, code.upper())


@router.get("/country/{code}/feed", response_model=List[FeedItemResponse])
async def get_country_feed(code: str, db: Session = Depends(get_db)):
    """Get feed items for a specific country."""
    country = CountryService.get_country_by_code(db, code.upper())
    if not country:
        raise HTTPException(status_code=404, detail="Country not found")
    return FeedService.get_feed_by_country(db, code.upper())
