"""
Business logic services for country and metrics data.
"""

from sqlalchemy.orm import Session
from app.models.country import Country, Alert, FeedItem, GlobalMetrics
from app.schemas.country import (
    CountryResponse,
    RiskScores,
    AlertResponse,
    FeedItemResponse,
    GlobalMetricsResponse,
    SummaryResponse,
)
from typing import List


class CountryService:
    """Service for country-related operations."""

    @staticmethod
    def get_all_countries(db: Session) -> List[CountryResponse]:
        """Get all countries with their risk profiles."""
        countries = db.query(Country).all()
        result = []
        for c in countries:
            result.append(
                CountryResponse(
                    code=c.code,
                    name=c.name,
                    region=c.region,
                    lat=c.lat,
                    lon=c.lon,
                    risks=RiskScores(
                        water_stress=c.water_stress_score,
                        drought=c.drought_score,
                        flood=c.flood_score,
                        food_insecurity=c.food_insecurity_score,
                        migration_pressure=c.migration_pressure_score,
                        infrastructure_disruption=c.infrastructure_disruption_score,
                    ),
                    fusion_score=c.overall_fusion_score,
                    severity=c.severity,
                    ai_summary=c.ai_summary,
                    data_source=c.data_source or "demo",
                    estimated_vectors=(
                        c.estimated_vectors.split(",") if c.estimated_vectors else []
                    ),
                    updated_at=c.updated_at,
                )
            )
        return result

    @staticmethod
    def get_country_by_code(db: Session, code: str) -> CountryResponse | None:
        """Get a specific country by code."""
        country = db.query(Country).filter(Country.code == code).first()
        if not country:
            return None

        return CountryResponse(
            code=country.code,
            name=country.name,
            region=country.region,
            lat=country.lat,
            lon=country.lon,
            risks=RiskScores(
                water_stress=country.water_stress_score,
                drought=country.drought_score,
                flood=country.flood_score,
                food_insecurity=country.food_insecurity_score,
                migration_pressure=country.migration_pressure_score,
                infrastructure_disruption=country.infrastructure_disruption_score,
            ),
            fusion_score=country.overall_fusion_score,
            severity=country.severity,
            ai_summary=country.ai_summary,
            data_source=country.data_source or "demo",
            estimated_vectors=(
                country.estimated_vectors.split(",") if country.estimated_vectors else []
            ),
            updated_at=country.updated_at,
        )

    @staticmethod
    def get_country_summary(db: Session, code: str) -> SummaryResponse | None:
        """Get a country summary by code."""
        country = db.query(Country).filter(Country.code == code).first()
        if not country:
            return None

        return SummaryResponse(
            country_code=country.code,
            country_name=country.name,
            summary=country.ai_summary,
            fusion_score=country.overall_fusion_score,
            severity=country.severity,
        )


class AlertService:
    """Service for alert operations."""

    @staticmethod
    def get_all_alerts(db: Session) -> List[AlertResponse]:
        """Get all alerts sorted by severity and recency."""
        alerts = (
            db.query(Alert)
            .order_by(Alert.severity.desc(), Alert.timestamp.desc())
            .all()
        )
        return [
            AlertResponse(
                id=a.id,
                country_code=a.country_code,
                country_name=a.country_name,
                title=a.title,
                category=a.category,
                severity=a.severity,
                summary=a.summary,
                timestamp=a.timestamp,
                source=a.source or "",
                source_url=a.source_url or "",
            )
            for a in alerts
        ]

    @staticmethod
    def get_alerts_by_country(db: Session, country_code: str) -> List[AlertResponse]:
        """Get alerts for a specific country."""
        alerts = (
            db.query(Alert)
            .filter(Alert.country_code == country_code)
            .order_by(Alert.severity.desc(), Alert.timestamp.desc())
            .all()
        )
        return [
            AlertResponse(
                id=a.id,
                country_code=a.country_code,
                country_name=a.country_name,
                title=a.title,
                category=a.category,
                severity=a.severity,
                summary=a.summary,
                timestamp=a.timestamp,
                source=a.source or "",
                source_url=a.source_url or "",
            )
            for a in alerts
        ]


class FeedService:
    """Service for feed operations."""

    @staticmethod
    def get_all_feed_items(db: Session, limit: int = 100) -> List[FeedItemResponse]:
        """Get all feed items sorted by recency."""
        items = (
            db.query(FeedItem)
            .order_by(FeedItem.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [
            FeedItemResponse(
                id=f.id,
                country_code=f.country_code,
                country_name=f.country_name,
                title=f.title,
                category=f.category,
                urgency=f.urgency,
                summary=f.summary,
                timestamp=f.timestamp,
                source=f.source or "",
                source_url=f.source_url or "",
            )
            for f in items
        ]

    @staticmethod
    def get_feed_by_country(
        db: Session, country_code: str, limit: int = 50
    ) -> List[FeedItemResponse]:
        """Get feed items for a specific country."""
        items = (
            db.query(FeedItem)
            .filter(FeedItem.country_code == country_code)
            .order_by(FeedItem.timestamp.desc())
            .limit(limit)
            .all()
        )
        return [
            FeedItemResponse(
                id=f.id,
                country_code=f.country_code,
                country_name=f.country_name,
                title=f.title,
                category=f.category,
                urgency=f.urgency,
                summary=f.summary,
                timestamp=f.timestamp,
                source=f.source or "",
                source_url=f.source_url or "",
            )
            for f in items
        ]


class MetricsService:
    """Service for global metrics operations."""

    @staticmethod
    def get_global_metrics(db: Session) -> GlobalMetricsResponse:
        """Get current global metrics."""
        metrics = db.query(GlobalMetrics).filter(GlobalMetrics.id == "current").first()

        if not metrics:
            # Fallback: calculate on the fly
            countries = db.query(Country).all()
            critical = len([c for c in countries if c.severity == "critical"])
            elevated = len([c for c in countries if c.severity == "elevated"])
            alerts = db.query(Alert).count()
            avg_fusion = (
                sum(c.overall_fusion_score for c in countries) / len(countries)
                if countries
                else 0
            )
            top = (
                max(countries, key=lambda c: c.overall_fusion_score).code
                if countries
                else "N/A"
            )

            return GlobalMetricsResponse(
                active_alerts=alerts,
                critical_countries=critical,
                elevated_countries=elevated,
                avg_fusion_score=round(avg_fusion, 2),
                top_hotspot=top,
                data_source=countries[0].data_source if countries else "demo",
                updated_at=countries[0].updated_at if countries else None,
            )

        return GlobalMetricsResponse(
            active_alerts=metrics.active_alerts,
            critical_countries=metrics.critical_countries,
            elevated_countries=metrics.elevated_countries,
            avg_fusion_score=metrics.avg_fusion_score,
            top_hotspot=metrics.top_hotspot,
            data_source=metrics.data_source or "demo",
            updated_at=metrics.updated_at,
        )
