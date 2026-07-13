"""Score normalization and fusion math.

This module is the single source of truth for the fusion formula on the
backend. The frontend mirror lives in src/data/types.ts (RISK_WEIGHTS,
getSeverity) and is covered by tests on both sides to keep them in sync.

Normalization choices (documented in the Methodology page and README):

- water_stress: World Bank ER.H2O.FWST.ZS is already "freshwater withdrawal
  as % of available resources". Values can exceed 100 (fossil-aquifer
  states); we clamp to 0-100.
- food_insecurity: World Bank SN.ITK.DEFC.ZS (prevalence of undernourishment,
  % of population). Linear map: 0% -> 0, 40%+ -> 100 (score = pct * 2.5).
- infrastructure_disruption: proxy = 100 - EG.ELC.ACCS.ZS (access to
  electricity, % of population). A structural-fragility proxy, not a live
  outage measure.
- migration_pressure: log scale of total displaced persons originating from
  the country (UNHCR refugees + asylum seekers + IDPs).
  100 people -> 0, 10M -> 100: score = 20 * (log10(total) - 2).
- drought / flood: driven by active GDACS events:
  Red -> 92, Orange -> 68, Green -> 42; no active event -> None
  (caller falls back to the curated baseline and flags the vector
  as estimated).
"""

from math import log10

WEIGHTS = {
    "water_stress": 0.25,
    "drought": 0.20,
    "flood": 0.20,
    "food_insecurity": 0.15,
    "migration_pressure": 0.10,
    "infrastructure_disruption": 0.10,
}

VECTORS = list(WEIGHTS.keys())

GDACS_ALERT_SCORES = {"red": 92, "orange": 68, "green": 42}


def clamp_score(value: float) -> int:
    """Clamp a raw value into the 0-100 integer score range."""
    return int(round(min(100.0, max(0.0, value))))


def calculate_fusion_score(scores: dict) -> float:
    """Weighted fusion score from a dict of the six vector scores."""
    return round(sum(scores[vector] * weight for vector, weight in WEIGHTS.items()))


def get_severity(score: float) -> str:
    """Severity band for a 0-100 score."""
    if score >= 75:
        return "critical"
    if score >= 55:
        return "high"
    if score >= 35:
        return "elevated"
    return "low"


def score_water_stress(withdrawal_pct: float) -> int:
    return clamp_score(withdrawal_pct)


def score_food_insecurity(undernourishment_pct: float) -> int:
    return clamp_score(undernourishment_pct * 2.5)


def score_infrastructure(electricity_access_pct: float) -> int:
    return clamp_score(100.0 - electricity_access_pct)


def score_migration(total_displaced: float) -> int:
    if total_displaced is None or total_displaced < 100:
        return 0
    return clamp_score(20.0 * (log10(total_displaced) - 2.0))


def score_hazard_events(alert_levels: list) -> int | None:
    """Max score across active GDACS events; None when no events."""
    scores = [
        GDACS_ALERT_SCORES[level.lower()]
        for level in alert_levels
        if level and level.lower() in GDACS_ALERT_SCORES
    ]
    return max(scores) if scores else None
