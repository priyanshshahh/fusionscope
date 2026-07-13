"""Refresh pipeline: pulls live data and rebuilds the database.

Usage:
    python -m app.etl.refresh          # live mode (World Bank, GDACS, UNHCR[, ReliefWeb])
    python -m app.etl.refresh --demo   # demo mode (curated baselines, labeled "demo")

Live mode labels every country row data_source="live" and records, per
country, which vectors fell back to the curated baseline (estimated_vectors).
Demo mode labels everything data_source="demo" and fabricates nothing beyond
the clearly-labeled curated baseline dataset.
"""

import argparse
import sys
from datetime import datetime, timezone

import httpx

from app.db.database import Base, SessionLocal, engine
from app.models.country import Alert, Country, FeedItem, GlobalMetrics
from app.etl import gdacs, reliefweb, unhcr, worldbank
from app.etl.scoring import (
    VECTORS,
    calculate_fusion_score,
    get_severity,
    score_food_insecurity,
    score_hazard_events,
    score_infrastructure,
    score_migration,
    score_water_stress,
)

VECTOR_LABELS = {
    "water_stress": "water stress",
    "drought": "drought",
    "flood": "flood",
    "food_insecurity": "food insecurity",
    "migration_pressure": "migration pressure",
    "infrastructure_disruption": "infrastructure fragility",
}

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def _readable_date(iso_date: str) -> str:
    try:
        parsed = datetime.strptime(iso_date, "%Y-%m-%d")
        return f"{MONTHS[parsed.month - 1]} {parsed.day}, {parsed.year}"
    except ValueError:
        return iso_date


def build_summary(name: str, scores: dict, severity: str, fusion: float,
                  estimated: list, demo: bool) -> str:
    """Deterministic, honest summary generated from the actual scores."""
    top = sorted(scores.items(), key=lambda item: item[1], reverse=True)[:2]
    vectors_text = " and ".join(f"{VECTOR_LABELS[v]} ({s}/100)" for v, s in top)
    text = (
        f"{name} registers a {severity.upper()} composite risk of {fusion:.0f}/100. "
        f"Highest-pressure vectors: {vectors_text}."
    )
    if demo:
        text += " Scores are curated demo baselines, not live measurements."
    elif estimated:
        labels = ", ".join(VECTOR_LABELS[v] for v in estimated)
        text += (
            f" Live indicators from World Bank, GDACS and UNHCR; "
            f"estimated from baseline: {labels}."
        )
    else:
        text += " All vectors scored from live World Bank, GDACS and UNHCR data."
    return text


def collect_live_scores(roster: list, client: httpx.Client) -> dict:
    """Fetch all live sources. Returns {iso3: {"scores": {...}, "estimated": [...]}}."""
    codes = [c["code"] for c in roster]
    wb = worldbank.fetch_all(client, codes)
    hazard_levels = gdacs.hazard_alert_levels(gdacs.fetch_hazard_events(client))
    displacement = unhcr.fetch_displacement(
        client, codes, year=datetime.now(timezone.utc).year - 1
    )

    normalizers = {
        "water_stress": score_water_stress,
        "food_insecurity": score_food_insecurity,
        "infrastructure_disruption": score_infrastructure,
    }

    results = {}
    for entry in roster:
        code = entry["code"]
        scores, estimated = {}, []

        for vector, normalize in normalizers.items():
            raw = wb.get(vector, {}).get(code)
            if raw is not None:
                scores[vector] = normalize(raw[0])
            else:
                scores[vector] = entry[vector]
                estimated.append(vector)

        for vector in ("drought", "flood"):
            levels = hazard_levels.get(code, {}).get(vector, [])
            event_score = score_hazard_events(levels)
            if event_score is not None:
                scores[vector] = event_score
            else:
                scores[vector] = entry[vector]
                estimated.append(vector)

        if code in displacement:
            scores["migration_pressure"] = score_migration(displacement[code])
        else:
            scores["migration_pressure"] = entry["migration_pressure"]
            estimated.append("migration_pressure")

        results[code] = {"scores": scores, "estimated": estimated}
    return results


def build_alerts_and_feed(roster: list, client: httpx.Client,
                          reliefweb_appname: str = "") -> tuple:
    """Real alerts and feed items from GDACS (and ReliefWeb when enabled)."""
    roster_by_code = {c["code"]: c for c in roster}
    events = gdacs.fetch_current_events(client) + gdacs.fetch_hazard_events(client)

    alerts, feed, seen = [], [], set()
    for event in sorted(events, key=lambda e: e["from_date"], reverse=True):
        for iso3 in event["iso3s"]:
            if iso3 not in roster_by_code:
                continue
            key = (event["event_id"], iso3)
            if key in seen:
                continue
            seen.add(key)
            country = roster_by_code[iso3]
            severity = gdacs.ALERT_SEVERITY.get(event["alert_level"], "elevated")
            base = {
                "country_code": iso3,
                "country_name": country["name"],
                "title": event["title"] or event["description"],
                "category": event["category"],
                "summary": event["description"] or event["title"],
                "source": "GDACS",
                "source_url": event["report_url"],
            }
            if severity in ("critical", "high", "elevated"):
                alerts.append(
                    {
                        **base,
                        "id": f"gdacs-{event['event_id']}-{iso3}",
                        "severity": severity,
                        "timestamp": event["from_date"],
                    }
                )
            feed.append(
                {
                    **base,
                    "id": f"gdacs-feed-{event['event_id']}-{iso3}",
                    "urgency": severity,
                    "timestamp": _readable_date(event["from_date"]),
                }
            )

    if reliefweb_appname:
        for country in roster:
            try:
                reports = reliefweb.fetch_reports(
                    client, reliefweb_appname, country["code"], country["name"]
                )
            except httpx.HTTPError:
                continue
            for report in reports:
                feed.append(
                    {
                        **report,
                        "category": "food_insecurity",
                        "urgency": "elevated",
                        "summary": report["title"],
                        "timestamp": _readable_date(report["timestamp"]),
                    }
                )
    return alerts, feed


def run_refresh(demo: bool = False, reliefweb_appname: str = "") -> dict:
    """Rebuild the database. Returns summary statistics."""
    from seed_data.countries import SEED_COUNTRIES

    now = datetime.now(timezone.utc)
    data_source = "demo" if demo else "live"

    live_scores, alerts, feed = {}, [], []
    if not demo:
        transport = httpx.HTTPTransport(retries=2)
        with httpx.Client(
            timeout=httpx.Timeout(90, connect=15),
            headers={"User-Agent": "fusionscope-etl"},
            transport=transport,
        ) as client:
            live_scores = collect_live_scores(SEED_COUNTRIES, client)
            alerts, feed = build_alerts_and_feed(
                SEED_COUNTRIES, client, reliefweb_appname
            )

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        countries = []
        for entry in SEED_COUNTRIES:
            if demo:
                scores = {v: entry[v] for v in VECTORS}
                estimated: list = []
            else:
                scores = live_scores[entry["code"]]["scores"]
                estimated = live_scores[entry["code"]]["estimated"]

            fusion = calculate_fusion_score(scores)
            severity = get_severity(fusion)
            country = Country(
                code=entry["code"],
                name=entry["name"],
                region=entry["region"],
                lat=entry["lat"],
                lon=entry["lon"],
                water_stress_score=scores["water_stress"],
                drought_score=scores["drought"],
                flood_score=scores["flood"],
                food_insecurity_score=scores["food_insecurity"],
                migration_pressure_score=scores["migration_pressure"],
                infrastructure_disruption_score=scores["infrastructure_disruption"],
                overall_fusion_score=fusion,
                severity=severity,
                ai_summary=build_summary(
                    entry["name"], scores, severity, fusion, estimated, demo
                ),
                data_source=data_source,
                estimated_vectors=",".join(estimated),
                updated_at=now,
            )
            countries.append(country)
            db.add(country)

        if demo:
            # Deterministic, clearly-labeled demo alerts/feed derived from baselines.
            for country in countries:
                for vector in VECTORS:
                    score = getattr(country, f"{vector}_score")
                    if score >= 55:
                        alerts.append(
                            {
                                "id": f"demo-{country.code}-{vector}",
                                "country_code": country.code,
                                "country_name": country.name,
                                "title": f"{VECTOR_LABELS[vector].title()} baseline at {score}/100",
                                "category": vector,
                                "severity": get_severity(score),
                                "summary": (
                                    f"Curated demo baseline places {country.name} "
                                    f"{VECTOR_LABELS[vector]} at {score}/100."
                                ),
                                "source": "demo",
                                "source_url": "",
                                "timestamp": now.strftime("%Y-%m-%d"),
                            }
                        )
            feed = [
                {**alert, "id": f"demo-feed-{alert['id']}",
                 "urgency": alert["severity"],
                 "timestamp": _readable_date(alert["timestamp"])}
                for alert in alerts
            ]

        for alert in alerts:
            db.add(Alert(**{k: v for k, v in alert.items() if k != "urgency"}))
        for item in feed:
            db.add(FeedItem(**{k: v for k, v in item.items() if k != "severity"}))

        critical = sum(1 for c in countries if c.severity == "critical")
        elevated = sum(1 for c in countries if c.severity == "elevated")
        avg_fusion = sum(c.overall_fusion_score for c in countries) / len(countries)
        top = max(countries, key=lambda c: c.overall_fusion_score)
        db.add(
            GlobalMetrics(
                id="current",
                active_alerts=len(alerts),
                critical_countries=critical,
                elevated_countries=elevated,
                avg_fusion_score=round(avg_fusion, 2),
                top_hotspot=top.code,
                data_source=data_source,
                updated_at=now,
            )
        )
        db.commit()
        return {
            "data_source": data_source,
            "countries": len(countries),
            "alerts": len(alerts),
            "feed_items": len(feed),
            "refreshed_at": now.isoformat(),
        }
    finally:
        db.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Refresh FusionScope data")
    parser.add_argument("--demo", action="store_true", help="load curated demo baselines")
    args = parser.parse_args()

    from app.core.config import settings

    try:
        stats = run_refresh(demo=args.demo, reliefweb_appname=settings.reliefweb_appname)
    except httpx.HTTPError as error:
        print(f"Refresh failed ({error}); no changes written.", file=sys.stderr)
        return 1
    print(f"Refreshed: {stats}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
