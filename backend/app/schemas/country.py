from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RiskScores(BaseModel):
    water_stress: int
    drought: int
    flood: int
    food_insecurity: int
    migration_pressure: int
    infrastructure_disruption: int


class CountryResponse(BaseModel):
    code: str
    name: str
    region: str
    lat: float
    lon: float
    risks: RiskScores
    fusion_score: float
    severity: str
    ai_summary: str
    updated_at: datetime

    model_config = {"from_attributes": True}


class CountryDetail(CountryResponse):
    pass


class AlertResponse(BaseModel):
    id: str
    country_code: str
    country_name: str
    title: str
    category: str
    severity: str
    summary: str
    timestamp: str

    model_config = {"from_attributes": True}


class FeedItemResponse(BaseModel):
    id: str
    country_code: str
    country_name: str
    title: str
    category: str
    urgency: str
    summary: str
    timestamp: str

    model_config = {"from_attributes": True}


class GlobalMetricsResponse(BaseModel):
    active_alerts: int
    critical_countries: int
    elevated_countries: int
    avg_fusion_score: float
    top_hotspot: str


class SummaryResponse(BaseModel):
    country_code: str
    country_name: str
    summary: str
    fusion_score: float
    severity: str
