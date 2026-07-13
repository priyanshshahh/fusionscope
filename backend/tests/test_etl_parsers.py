"""Parser tests against recorded API responses (tests/fixtures/*.json).

worldbank / gdacs / unhcr fixtures were recorded from the real public APIs
(trimmed for size). The ReliefWeb fixture is a minimal synthetic example of
the documented v2 response shape, because the API requires an approved
appname we do not ship.
"""

import json
from pathlib import Path

from app.etl.gdacs import hazard_alert_levels, parse_events
from app.etl.reliefweb import parse_reports
from app.etl.unhcr import parse_population
from app.etl.worldbank import parse_indicator

FIXTURES = Path(__file__).parent / "fixtures"


def load(name):
    return json.loads((FIXTURES / name).read_text())


def test_worldbank_parse_recorded_response():
    result = parse_indicator(load("worldbank_water_stress.json"))
    assert "KEN" in result and "SAU" in result
    value, year = result["KEN"]
    assert 0 < value < 100
    assert year.isdigit()
    # Saudi Arabia withdraws multiples of its renewable resources
    assert result["SAU"][0] > 100


def test_worldbank_parse_handles_empty_rows():
    assert parse_indicator([{"page": 1}, None]) == {}
    assert parse_indicator({"message": "error"}) == {}


def test_gdacs_parse_recorded_events():
    events = parse_events(load("gdacs_events.json"))
    assert events, "recorded fixture should contain mappable events"
    for event in events:
        assert event["category"] in (
            "drought", "flood", "infrastructure_disruption"
        )
        assert event["alert_level"] in ("green", "orange", "red")
        assert event["iso3s"], "every event should map to at least one iso3"
        assert event["report_url"].startswith("https://www.gdacs.org")


def test_gdacs_hazard_grouping_only_keeps_drought_and_flood():
    events = [
        {"category": "flood", "iso3s": ["BGD"], "alert_level": "orange"},
        {"category": "infrastructure_disruption", "iso3s": ["PHL"], "alert_level": "red"},
        {"category": "drought", "iso3s": ["ETH", "KEN"], "alert_level": "green"},
    ]
    grouped = hazard_alert_levels(events)
    assert grouped["BGD"]["flood"] == ["orange"]
    assert grouped["ETH"]["drought"] == ["green"]
    assert "PHL" not in grouped


def test_unhcr_parse_recorded_population():
    totals = parse_population(load("unhcr_population.json"))
    assert totals.get("SOM", 0) > 1_000_000  # refugees + asylum seekers + IDPs
    assert all(isinstance(v, int) for v in totals.values())


def test_unhcr_parse_tolerates_string_and_missing_fields():
    payload = {"items": [
        {"coo_iso": "XYZ", "refugees": "10", "asylum_seekers": None, "idps": "-"},
        {"refugees": 999},  # no iso3 -> skipped
    ]}
    assert parse_population(payload) == {"XYZ": 10}


def test_reliefweb_parse_documented_shape():
    payload = {
        "data": [
            {
                "id": "123",
                "fields": {
                    "title": "Situation Report",
                    "url": "https://reliefweb.int/node/123",
                    "date": {"created": "2026-07-01T00:00:00+00:00"},
                    "source": [{"shortname": "OCHA"}],
                },
            }
        ]
    }
    items = parse_reports(payload, "SOM", "Somalia")
    assert items == [{
        "id": "rw-123",
        "country_code": "SOM",
        "country_name": "Somalia",
        "title": "Situation Report",
        "source": "OCHA",
        "source_url": "https://reliefweb.int/node/123",
        "timestamp": "2026-07-01",
    }]
