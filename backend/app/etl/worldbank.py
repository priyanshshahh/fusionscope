"""World Bank indicator API client.

API: https://api.worldbank.org/v2/country/{codes}/indicator/{id}?format=json&mrv=1
No API key required. One request per indicator covers all roster countries
(codes joined with ';').
"""

import httpx

BASE_URL = "https://api.worldbank.org/v2"

INDICATORS = {
    "water_stress": "ER.H2O.FWST.ZS",          # freshwater withdrawal, % of resources
    "food_insecurity": "SN.ITK.DEFC.ZS",        # prevalence of undernourishment, %
    "infrastructure_disruption": "EG.ELC.ACCS.ZS",  # access to electricity, %
}


def parse_indicator(payload) -> dict:
    """Parse a World Bank indicator response into {iso3: (value, year)}.

    Payload is [metadata, rows]; rows may be None when nothing matched.
    Rows with null values are skipped.
    """
    result = {}
    if not isinstance(payload, list) or len(payload) < 2 or not payload[1]:
        return result
    for row in payload[1]:
        iso3 = row.get("countryiso3code")
        value = row.get("value")
        if iso3 and value is not None:
            # mrv=1 returns one row per country; keep the first (latest) seen
            result.setdefault(iso3, (float(value), row.get("date", "")))
    return result


CHUNK_SIZE = 20  # the API rejects requests with too many country codes


def fetch_indicator(client: httpx.Client, iso3_codes: list, indicator: str) -> dict:
    """Fetch the most recent non-empty value of one indicator for many countries."""
    result: dict = {}
    for start in range(0, len(iso3_codes), CHUNK_SIZE):
        chunk = iso3_codes[start : start + CHUNK_SIZE]
        response = client.get(
            f"{BASE_URL}/country/{';'.join(chunk)}/indicator/{indicator}",
            params={"format": "json", "mrv": 1, "per_page": len(chunk) * 2},
        )
        response.raise_for_status()
        result.update(parse_indicator(response.json()))
    return result


def fetch_all(client: httpx.Client, iso3_codes: list) -> dict:
    """Fetch every configured indicator. Returns {vector: {iso3: (value, year)}}."""
    return {
        vector: fetch_indicator(client, iso3_codes, indicator_id)
        for vector, indicator_id in INDICATORS.items()
    }
