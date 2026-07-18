from sqlalchemy import Column, String, Float, Integer, DateTime
from sqlalchemy.sql import func
from app.db.database import Base


class Country(Base):
    __tablename__ = "countries"

    code = Column(String, primary_key=True)
    name = Column(String, unique=True, index=True)
    region = Column(String)
    lat = Column(Float)
    lon = Column(Float)
    
    # Risk Scores (0-100)
    water_stress_score = Column(Integer)
    drought_score = Column(Integer)
    flood_score = Column(Integer)
    food_insecurity_score = Column(Integer)
    migration_pressure_score = Column(Integer)
    infrastructure_disruption_score = Column(Integer)
    
    # Computed Scores
    overall_fusion_score = Column(Float)
    severity = Column(String)  # low, elevated, high, critical
    
    # Summary
    ai_summary = Column(String)

    # Data provenance
    data_source = Column(String, default="demo")  # live | demo
    estimated_vectors = Column(String, default="")  # comma-separated vector names

    # Timestamp
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String, primary_key=True)
    country_code = Column(String, index=True)
    country_name = Column(String)
    title = Column(String)
    category = Column(String)  # waterStress, drought, flood, etc.
    severity = Column(String)  # low, elevated, high, critical
    summary = Column(String)
    timestamp = Column(String)
    source = Column(String, default="")  # e.g. GDACS
    source_url = Column(String, default="")


class FeedItem(Base):
    __tablename__ = "feed_items"

    id = Column(String, primary_key=True)
    country_code = Column(String, index=True)
    country_name = Column(String)
    title = Column(String)
    category = Column(String)
    urgency = Column(String)  # severity equivalent for feed
    summary = Column(String)
    timestamp = Column(String)
    source = Column(String, default="")
    source_url = Column(String, default="")


class GlobalMetrics(Base):
    __tablename__ = "global_metrics"

    id = Column(String, primary_key=True, default="current")
    active_alerts = Column(Integer)
    critical_countries = Column(Integer)
    elevated_countries = Column(Integer)
    avg_fusion_score = Column(Float)
    top_hotspot = Column(String)  # country code
    data_source = Column(String, default="demo")  # live | demo
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class ScoreHistory(Base):
    """Append-only fusion-score history, one row per country per refresh.

    Deliberately never truncated by the refresh (unlike the countries/alerts/
    feed/metrics tables, which are rebuilt each cycle) so real trend lines
    accumulate over time. Powers GET /api/history/{code}.
    """

    __tablename__ = "score_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_code = Column(String, index=True)
    fusion_score = Column(Float)
    severity = Column(String)
    data_source = Column(String)  # live | demo
    recorded_at = Column(DateTime, index=True)
