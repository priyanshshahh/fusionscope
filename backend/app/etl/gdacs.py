"""GDACS (Global Disaster Alert and Coordination System) event client.

Two endpoints, both keyless:
- EVENTS4APP: current events of all hazard types (feed + alerts)
- SEARCH: windowed drought/flood events (hazard scoring), because droughts
  and floods age out of the current-events list while still being relevant.

Alert level mapping: Red -> critical, Orange -> high, Green -> elevated.
Event type -> risk vector mapping (documented modeling choice):
    DR -> drought, FL -> flood, TC -> flood,
    EQ / VO / WF -> infrastructure_disruption
"""

from datetime import date, timedelta

import httpx

CURRENT_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP"
SEARCH_URL = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH"

HAZARD_WINDOW_DAYS = 180

EVENT_CATEGORY = {
    "DR": "drought",
    "FL": "flood",
    "TC": "flood",
    "EQ": "infrastructure_disruption",
    "VO": "infrastructure_disruption",
    "WF": "infrastructure_disruption",
}

ALERT_SEVERITY = {"red": "critical", "orange": "high", "green": "elevated"}


def parse_events(geojson: dict) -> list:
    """Flatten a GDACS FeatureCollection into event dicts we care about."""
    events = []
    for feature in geojson.get("features", []):
        props = feature.get("properties", {})
        event_type = props.get("eventtype")
        if event_type not in EVENT_CATEGORY:
            continue
        iso3s = {props.get("iso3", "")}
        for country in props.get("affectedcountries") or []:
            iso3s.add(country.get("iso3", ""))
        url = props.get("url") or {}
        events.append(
            {
                "event_id": props.get("eventid"),
                "event_type": event_type,
                "category": EVENT_CATEGORY[event_type],
                "alert_level": (props.get("alertlevel") or "").lower(),
                "title": props.get("name") or props.get("description") or "",
                "description": props.get("description") or "",
                "iso3s": sorted(code for code in iso3s if code),
                "from_date": (props.get("fromdate") or "")[:10],
                "report_url": url.get("report", ""),
            }
        )
    return events


def fetch_current_events(client: httpx.Client) -> list:
    """Current events across all hazard types."""
    response = client.get(CURRENT_URL)
    response.raise_for_status()
    return parse_events(response.json())


def fetch_hazard_events(client: httpx.Client, window_days: int = HAZARD_WINDOW_DAYS) -> list:
    """Drought and flood events within the scoring window."""
    today = date.today()
    response = client.get(
        SEARCH_URL,
        params={
            "fromDate": (today - timedelta(days=window_days)).isoformat(),
            "toDate": today.isoformat(),
            "alertlevel": "Green;Orange;Red",
            "eventlist": "DR;FL",
        },
    )
    response.raise_for_status()
    return parse_events(response.json())


def hazard_alert_levels(events: list) -> dict:
    """Group alert levels by (iso3, vector) for drought/flood scoring.

    Returns {iso3: {"drought": [levels], "flood": [levels]}}.
    """
    grouped: dict = {}
    for event in events:
        if event["category"] not in ("drought", "flood"):
            continue
        for iso3 in event["iso3s"]:
            grouped.setdefault(iso3, {}).setdefault(event["category"], []).append(
                event["alert_level"]
            )
    return grouped
