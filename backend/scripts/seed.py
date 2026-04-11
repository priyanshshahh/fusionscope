"""
Seed data generator for FusionScope database.
Populates countries, alerts, feed items, and global metrics.
"""

from seed_data.countries import SEED_COUNTRIES
from app.models.country import Country, Alert, FeedItem, GlobalMetrics
from app.db.database import SessionLocal, engine, Base
from datetime import datetime, timedelta
import random

# Risk categories and corresponding alert titles
ALERT_TITLES = {
    "water_stress": [
        "Aquifer depletion exceeds safe yield threshold",
        "Municipal water rationing declared",
        "Groundwater contamination detected in primary source",
    ],
    "drought": [
        "Consecutive failed rainy seasons confirmed",
        "Crop failure imminent in primary agricultural zones",
        "Pastoral migration routes disrupted by drought",
    ],
    "flood": [
        "Flash flood warning issued for major river basin",
        "Critical infrastructure submerged in capital region",
        "Displaced population exceeds shelter capacity",
    ],
    "food_insecurity": [
        "Food price index exceeds 3-year high",
        "Supply chain disruption affecting grain imports",
        "Acute malnutrition rates rising in vulnerable populations",
    ],
    "migration_pressure": [
        "Cross-border displacement surge detected",
        "Refugee camp capacity exceeded by 200%",
        "Internal displacement corridor forming along conflict axis",
    ],
    "infrastructure_disruption": [
        "Power grid failure affecting 40% of territory",
        "Transportation network severed by structural damage",
        "Communication blackout in eastern provinces",
    ],
}

FEED_SUMMARIES = {
    "water_stress": "Water stress levels {country} are exceeding critical thresholds. Monitoring systems indicate accelerating depletion of primary water sources.",
    "drought": "Drought conditions in {country} are creating severe agricultural stress. Multiple indicators suggest food security implications.",
    "flood": "Flooding events in {country} are disrupting infrastructure and displacing populations. Emergency response coordination is ongoing.",
    "food_insecurity": "Food insecurity in {country} is escalating rapidly. Supply chain disruptions and market volatility are creating acute vulnerability.",
    "migration_pressure": "Migration pressure from {country} is intensifying. Cross-border displacement is accelerating and straining receiving regions.",
    "infrastructure_disruption": "Infrastructure disruption in {country} is cascading across sectors. Critical service delivery is compromised.",
}


def calculate_fusion_score(country_data: dict) -> float:
    """Calculate fusion score using weighted risk formula."""
    return round(
        country_data["water_stress"] * 0.25
        + country_data["drought"] * 0.20
        + country_data["flood"] * 0.20
        + country_data["food_insecurity"] * 0.15
        + country_data["migration_pressure"] * 0.10
        + country_data["infrastructure_disruption"] * 0.10
    )


def get_severity(score: float) -> str:
    """Get severity band from fusion score."""
    if score >= 75:
        return "critical"
    elif score >= 55:
        return "high"
    elif score >= 35:
        return "elevated"
    return "low"


def seed_database():
    """Populate database with seed data."""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clear existing data
        db.query(Country).delete()
        db.query(Alert).delete()
        db.query(FeedItem).delete()
        db.query(GlobalMetrics).delete()

        # Seed countries
        countries = []
        for country_data in SEED_COUNTRIES:
            fusion_score = calculate_fusion_score(country_data)
            severity = get_severity(fusion_score)

            country = Country(
                code=country_data["code"],
                name=country_data["name"],
                region=country_data["region"],
                lat=country_data["lat"],
                lon=country_data["lon"],
                water_stress_score=country_data["water_stress"],
                drought_score=country_data["drought"],
                flood_score=country_data["flood"],
                food_insecurity_score=country_data["food_insecurity"],
                migration_pressure_score=country_data["migration_pressure"],
                infrastructure_disruption_score=country_data["infrastructure_disruption"],
                overall_fusion_score=fusion_score,
                severity=severity,
                ai_summary=country_data["summary"],
                updated_at=datetime.utcnow(),
            )
            countries.append(country)
            db.add(country)

        db.commit()

        # Seed alerts
        alert_id = 0
        risk_fields = [
            ("water_stress", "water_stress_score"),
            ("drought", "drought_score"),
            ("flood", "flood_score"),
            ("food_insecurity", "food_insecurity_score"),
            ("migration_pressure", "migration_pressure_score"),
            ("infrastructure_disruption", "infrastructure_disruption_score"),
        ]

        for country in countries:
            for risk_name, score_field in risk_fields:
                score = getattr(country, score_field)
                if score >= 55:
                    title = random.choice(ALERT_TITLES[risk_name])
                    severity = get_severity(score)
                    days_ago = random.randint(0, 30)
                    timestamp = (datetime.utcnow() - timedelta(days=days_ago)).strftime(
                        "%Y-%m-%d"
                    )

                    alert = Alert(
                        id=f"alert-{alert_id}",
                        country_code=country.code,
                        country_name=country.name,
                        title=title,
                        category=risk_name,
                        severity=severity,
                        summary=f"Intelligence assessment indicates {title.lower()} in {country.name}. Fusion analysis correlates this with broader regional destabilization patterns.",
                        timestamp=timestamp,
                    )
                    db.add(alert)
                    alert_id += 1

        db.commit()

        # Seed feed items
        feed_id = 0
        for country in countries:
            for risk_name, score_field in risk_fields:
                score = getattr(country, score_field)
                if score >= 45:
                    title = f"{country.name}: {random.choice(ALERT_TITLES[risk_name])}"
                    summary = FEED_SUMMARIES[risk_name].format(country=country.name)
                    severity = get_severity(score)
                    months = [
                        "Jan",
                        "Feb",
                        "Mar",
                        "Apr",
                        "May",
                        "Jun",
                        "Jul",
                        "Aug",
                        "Sep",
                        "Oct",
                        "Nov",
                        "Dec",
                    ]
                    month = random.choice(months)
                    day = random.randint(1, 28)
                    timestamp = f"{month} {day}, 2025"

                    feed_item = FeedItem(
                        id=f"feed-{feed_id}",
                        country_code=country.code,
                        country_name=country.name,
                        title=title,
                        category=risk_name,
                        urgency=severity,
                        summary=summary,
                        timestamp=timestamp,
                    )
                    db.add(feed_item)
                    feed_id += 1

        db.commit()

        # Seed global metrics
        critical_count = len([c for c in countries if c.severity == "critical"])
        elevated_count = len([c for c in countries if c.severity == "elevated"])
        alert_count = db.query(Alert).count()
        avg_fusion = sum(c.overall_fusion_score for c in countries) / len(countries)
        top_country = max(countries, key=lambda c: c.overall_fusion_score)

        global_metrics = GlobalMetrics(
            id="current",
            active_alerts=alert_count,
            critical_countries=critical_count,
            elevated_countries=elevated_count,
            avg_fusion_score=round(avg_fusion, 2),
            top_hotspot=top_country.code,
            updated_at=datetime.utcnow(),
        )
        db.add(global_metrics)
        db.commit()

        print(f"✓ Seeded {len(countries)} countries")
        print(f"✓ Generated {alert_id} alerts")
        print(f"✓ Generated {feed_id} feed items")
        print(f"✓ Global metrics initialized")

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
    print("✓ Database seeding complete!")
