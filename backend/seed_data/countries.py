"""Curated demo baseline for FusionScope: 60 countries with per-vector risk
scores (0-100).

The canonical data lives in ``baseline.json`` next to this file and is the
single source of truth shared with the frontend (``src/data/mockData.ts``
imports the same JSON). This module just loads it. Country situation summaries
are generated deterministically from the scores at refresh time
(``app.etl.refresh.build_summary``), so no prose is stored here.
"""

import json
from pathlib import Path

_BASELINE_PATH = Path(__file__).with_name("baseline.json")

with _BASELINE_PATH.open(encoding="utf-8") as _f:
    SEED_COUNTRIES = json.load(_f)
