"""Source-outage resilience and atomic-rebuild tests for run_refresh.

These run against a temporary SQLite file and monkeypatch the ETL source
clients so no network is touched.
"""

import os
import tempfile

import httpx
import pytest

_tmpdir = tempfile.mkdtemp(prefix="fusionscope-resil-")
os.environ["DATABASE_URL"] = f"sqlite:///{_tmpdir}/resil.db"

from app.etl import gdacs, refresh, unhcr, worldbank  # noqa: E402
from app.etl.refresh import run_refresh  # noqa: E402
from app.db.database import SessionLocal  # noqa: E402
from app.models.country import Country, ScoreHistory  # noqa: E402


def _boom(*args, **kwargs):
    raise httpx.ConnectError("simulated outage")


def test_worldbank_outage_degrades_to_baseline_not_abort(monkeypatch):
    """A World Bank outage must not abort the refresh; its vectors fall back."""
    monkeypatch.setattr(worldbank, "fetch_all", _boom)
    # Keep the other sources cheap and empty rather than hitting the network.
    monkeypatch.setattr(gdacs, "fetch_hazard_events", lambda client, **k: [])
    monkeypatch.setattr(gdacs, "fetch_current_events", lambda client: [])
    monkeypatch.setattr(unhcr, "fetch_displacement", lambda client, codes, year: {})

    stats = run_refresh(demo=False)

    assert stats["data_source"] == "live"
    assert stats["countries"] >= 40
    assert stats["sources"]["worldbank"] == "unavailable"
    assert stats["sources"]["gdacs"] == "ok"
    assert stats["sources"]["unhcr"] == "ok"

    db = SessionLocal()
    try:
        som = db.query(Country).filter(Country.code == "SOM").first()
        estimated = som.estimated_vectors.split(",")
        # All three World Bank vectors fell back to baseline and are flagged.
        assert "water_stress" in estimated
        assert "food_insecurity" in estimated
        assert "infrastructure_disruption" in estimated
    finally:
        db.close()


def test_refresh_appends_history_without_dropping_prior_rows(monkeypatch):
    """History is append-only and survives a subsequent refresh."""
    monkeypatch.setattr(gdacs, "fetch_hazard_events", lambda client, **k: [])
    monkeypatch.setattr(gdacs, "fetch_current_events", lambda client: [])
    monkeypatch.setattr(unhcr, "fetch_displacement", lambda client, codes, year: {})
    monkeypatch.setattr(worldbank, "fetch_all", lambda client, codes: {})

    run_refresh(demo=True)
    db = SessionLocal()
    first_count = db.query(ScoreHistory).count()
    db.close()

    run_refresh(demo=True)
    db = SessionLocal()
    second_count = db.query(ScoreHistory).count()
    # Second refresh adds another row per country instead of truncating.
    assert second_count > first_count
    db.close()
