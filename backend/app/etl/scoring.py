"""Score normalization and fusion math.

This module is the single source of truth for the fusion formula on the
backend. The frontend mirror lives in src/data/types.ts (RISK_WEIGHTS,
DIMENSIONS, getSeverity, calculateFusionScore) and is covered by tests on
both sides to keep them in sync.

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

Aggregation (INFORM-aligned, see docs and the Methodology page):

The six vectors are grouped under the three dimensions of the INFORM Risk
Index (EC Joint Research Centre / DG ECHO):

  Hazard & Exposure       = drought, flood
  Vulnerability           = food_insecurity, migration_pressure
  Lack of Coping Capacity = water_stress, infrastructure_disruption

Each dimension is a weighted mean of its member vectors (the per-vector
weights below, renormalized within the dimension). The composite fusion
score is the *geometric* mean of the three dimension scores, matching
INFORM's method: risk requires all three dimensions to be present, so a
country cannot average away one severe dimension with two calm ones.
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

# INFORM Risk Index dimensions -> the FusionScope vectors that populate them.
DIMENSIONS = {
    "hazard_exposure": ["drought", "flood"],
    "vulnerability": ["food_insecurity", "migration_pressure"],
    "coping_capacity": ["water_stress", "infrastructure_disruption"],
}

DIMENSION_LABELS = {
    "hazard_exposure": "Hazard & Exposure",
    "vulnerability": "Vulnerability",
    "coping_capacity": "Lack of Coping Capacity",
}

GDACS_ALERT_SCORES = {"red": 92, "orange": 68, "green": 42}


def clamp_score(value: float) -> int:
    """Clamp a raw value into the 0-100 integer score range."""
    return int(round(min(100.0, max(0.0, value))))


def calculate_dimensions(scores: dict) -> dict:
    """Aggregate the six vectors into the three INFORM dimension scores.

    Each dimension is the weighted mean of its member vectors, using the
    per-vector WEIGHTS renormalized within the dimension. Returns a dict
    of {dimension: rounded 0-100 score}.
    """
    result = {}
    for dimension, members in DIMENSIONS.items():
        total_weight = sum(WEIGHTS[v] for v in members)
        weighted = sum(scores[v] * WEIGHTS[v] for v in members)
        result[dimension] = round(weighted / total_weight)
    return result


def calculate_fusion_score(scores: dict) -> float:
    """Composite score: geometric mean of the three INFORM dimensions.

    Geometric mean (INFORM's approach) means a single severe dimension is
    not diluted by two calm ones; conversely a dimension near zero pulls the
    composite down sharply, since disaster risk requires hazard, vulnerability
    and lack of coping capacity to coincide.
    """
    dims = calculate_dimensions(scores)
    product = 1.0
    for value in dims.values():
        product *= value
    return round(product ** (1.0 / 3.0))


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
