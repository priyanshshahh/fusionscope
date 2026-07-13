"""Fusion formula and normalization tests.

The frontend mirrors WEIGHTS and the severity bands in src/data/types.ts
(covered by src/test/fusion.test.ts); if you change one side, change both.
"""

import pytest

from app.etl.scoring import (
    WEIGHTS,
    calculate_fusion_score,
    clamp_score,
    get_severity,
    score_food_insecurity,
    score_hazard_events,
    score_infrastructure,
    score_migration,
    score_water_stress,
)


def test_weights_sum_to_one():
    assert sum(WEIGHTS.values()) == pytest.approx(1.0)


def test_fusion_score_matches_hand_computation():
    scores = {
        "water_stress": 80,
        "drought": 60,
        "flood": 40,
        "food_insecurity": 100,
        "migration_pressure": 50,
        "infrastructure_disruption": 30,
    }
    expected = 80 * 0.25 + 60 * 0.20 + 40 * 0.20 + 100 * 0.15 + 50 * 0.10 + 30 * 0.10
    assert calculate_fusion_score(scores) == round(expected)


@pytest.mark.parametrize(
    "score,severity",
    [(0, "low"), (34, "low"), (35, "elevated"), (54, "elevated"),
     (55, "high"), (74, "high"), (75, "critical"), (100, "critical")],
)
def test_severity_bands(score, severity):
    assert get_severity(score) == severity


def test_clamp_score_bounds():
    assert clamp_score(-5) == 0
    assert clamp_score(883.1) == 100  # Saudi-style fossil aquifer withdrawal
    assert clamp_score(42.4) == 42


def test_water_stress_clamps_over_100_percent():
    assert score_water_stress(883.0) == 100
    assert score_water_stress(33.2) == 33


def test_food_insecurity_linear_map():
    assert score_food_insecurity(0) == 0
    assert score_food_insecurity(20) == 50
    assert score_food_insecurity(40) == 100
    assert score_food_insecurity(60) == 100  # clamped


def test_infrastructure_is_inverse_of_electricity_access():
    assert score_infrastructure(100.0) == 0
    assert score_infrastructure(48.0) == 52


def test_migration_log_scale():
    assert score_migration(0) == 0
    assert score_migration(50) == 0        # below floor
    assert score_migration(10_000) == 40
    assert score_migration(1_000_000) == 80
    assert score_migration(50_000_000) == 100  # clamped


def test_hazard_events_take_max_level():
    assert score_hazard_events([]) is None
    assert score_hazard_events(["green"]) == 42
    assert score_hazard_events(["green", "red", "orange"]) == 92
    assert score_hazard_events(["unknown"]) is None
