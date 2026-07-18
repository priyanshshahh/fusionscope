"""API endpoint tests against a demo-seeded temporary database."""

import os
import tempfile

import pytest

_tmpdir = tempfile.mkdtemp(prefix="fusionscope-test-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmpdir}/test.db"

from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.etl.refresh import run_refresh  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="module")
def client():
    run_refresh(demo=True)  # offline, deterministic
    with TestClient(app) as test_client:
        yield test_client


def test_health_reports_demo_provenance(client):
    body = client.get("/api/health").json()
    assert body["status"] == "healthy"
    assert body["data_source"] == "demo"
    assert body["data_updated_at"]


def test_countries_labeled_demo_with_valid_scores(client):
    countries = client.get("/api/countries").json()
    assert len(countries) >= 40
    for country in countries:
        assert country["data_source"] == "demo"
        assert country["estimated_vectors"] == []
        assert 0 <= country["fusion_score"] <= 100
        assert country["severity"] in ("low", "elevated", "high", "critical")


def test_country_detail_and_404(client):
    som = client.get("/api/country/som").json()
    assert som["code"] == "SOM"
    assert set(som["risks"]) == {
        "water_stress", "drought", "flood",
        "food_insecurity", "migration_pressure", "infrastructure_disruption",
    }
    assert client.get("/api/country/ZZZ").status_code == 404


def test_country_exposes_inform_dimensions(client):
    som = client.get("/api/country/som").json()
    assert set(som["dimensions"]) == {
        "hazard_exposure", "vulnerability", "coping_capacity",
    }
    for value in som["dimensions"].values():
        assert 0 <= value <= 100


def test_history_accumulates_and_404(client):
    # Two demo refreshes (module fixture + auth test) should have appended
    # at least one history point per country.
    history = client.get("/api/history/som").json()
    assert history
    for point in history:
        assert point["fusion_score"] >= 0
        assert point["data_source"] == "demo"
        assert "recorded_at" in point
    assert client.get("/api/history/ZZZ").status_code == 404


def test_refresh_reports_per_source_status(client):
    settings.refresh_token = "secret-token"
    response = client.post(
        "/api/refresh?demo=true", headers={"X-Refresh-Token": "secret-token"}
    )
    settings.refresh_token = ""
    body = response.json()
    # Demo mode touches no upstream sources, so status is empty but present.
    assert "sources" in body
    assert body["countries"] >= 40


def test_alerts_carry_source_fields(client):
    alerts = client.get("/api/alerts").json()
    assert alerts
    for alert in alerts[:10]:
        assert alert["source"] == "demo"
        assert "source_url" in alert


def test_feed_respects_limit(client):
    assert len(client.get("/api/feed?limit=5").json()) == 5


def test_global_metrics_consistent_with_countries(client):
    metrics = client.get("/api/global-metrics").json()
    countries = client.get("/api/countries").json()
    assert metrics["data_source"] == "demo"
    critical = sum(1 for c in countries if c["severity"] == "critical")
    assert metrics["critical_countries"] == critical
    assert metrics["top_hotspot"] in {c["code"] for c in countries}


def test_refresh_endpoint_auth(client):
    # Not configured -> 503
    settings.refresh_token = ""
    assert client.post("/api/refresh").status_code == 503
    # Configured, wrong token -> 401
    settings.refresh_token = "secret-token"
    response = client.post("/api/refresh", headers={"X-Refresh-Token": "wrong"})
    assert response.status_code == 401
    # Correct token, demo mode -> rebuilds without network
    response = client.post(
        "/api/refresh?demo=true", headers={"X-Refresh-Token": "secret-token"}
    )
    assert response.status_code == 200
    assert response.json()["data_source"] == "demo"
    settings.refresh_token = ""
