"""UNHCR Refugee Data Finder API client (keyless).

API: https://api.unhcr.org/population/v1/population/?coo={iso3}&year={year}
Returns displacement totals originating from a country. We sum
refugees + asylum seekers + IDPs as the "displaced originating" total
that feeds the migration-pressure score.
"""

import httpx

BASE_URL = "https://api.unhcr.org/population/v1/population/"


def _to_int(value) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def parse_population(payload: dict) -> dict:
    """Sum displaced-person rows by country of origin: {iso3: total}."""
    totals: dict = {}
    for row in payload.get("items", []):
        iso3 = row.get("coo_iso") or row.get("coo")
        if not iso3:
            continue
        total = (
            _to_int(row.get("refugees"))
            + _to_int(row.get("asylum_seekers"))
            + _to_int(row.get("idps"))
        )
        totals[iso3] = totals.get(iso3, 0) + total
    return totals


def fetch_displacement(client: httpx.Client, iso3_codes: list, year: int) -> dict:
    """Fetch displacement totals for all roster countries in one request.

    Falls back to the previous year for countries with no rows yet
    (UNHCR publishes annual data with a lag).
    """
    totals: dict = {}
    for candidate_year in (year, year - 1, year - 2):
        missing = [code for code in iso3_codes if code not in totals]
        if not missing:
            break
        response = client.get(
            BASE_URL,
            params={"coo": ",".join(missing), "year": candidate_year, "limit": 1000},
        )
        response.raise_for_status()
        totals.update(parse_population(response.json()))
    return totals
