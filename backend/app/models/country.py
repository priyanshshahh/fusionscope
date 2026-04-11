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


class GlobalMetrics(Base):
    __tablename__ = "global_metrics"

    id = Column(String, primary_key=True, default="current")
    active_alerts = Column(Integer)
    critical_countries = Column(Integer)
    elevated_countries = Column(Integer)
    avg_fusion_score = Column(Float)
    top_hotspot = Column(String)  # country code
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
