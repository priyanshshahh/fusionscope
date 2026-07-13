"""ETL package: fetches real indicator data and loads it into the database.

Modules:
    scoring    - normalization + fusion score math (single source of truth)
    worldbank  - World Bank indicator API (water stress, undernourishment, electricity access)
    gdacs      - GDACS disaster event API (drought/flood events, alerts, feed)
    unhcr      - UNHCR Refugee Data Finder API (displacement / migration pressure)
    reliefweb  - ReliefWeb reports API (optional, requires approved appname)
    refresh    - orchestrator; run with `python -m app.etl.refresh [--demo]`
"""
