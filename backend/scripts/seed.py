"""Seed the database with the curated demo baseline (labeled data_source="demo").

Kept as a thin wrapper for backward compatibility; the actual loading logic
lives in app.etl.refresh. For live data run:  python -m app.etl.refresh
"""

from app.etl.refresh import run_refresh


def seed_database():
    stats = run_refresh(demo=True)
    print(f"Seeded demo data: {stats}")


if __name__ == "__main__":
    seed_database()
