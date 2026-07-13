"""ReliefWeb reports API client (optional source).

ReliefWeb v2 requires an *approved* appname (https://apidoc.reliefweb.int).
This source is therefore env-gated: set RELIEFWEB_APPNAME once approved and
the refresh pipeline will pull real humanitarian report headlines into the
feed. Without it, the feed is built from GDACS events instead.
"""

import httpx

BASE_URL = "https://api.reliefweb.int/v2/reports"


def parse_reports(payload: dict, iso3: str, country_name: str) -> list:
    """Convert a ReliefWeb reports response into feed item dicts."""
    items = []
    for entry in payload.get("data", []):
        fields = entry.get("fields", {})
        sources = fields.get("source") or []
        source_name = sources[0].get("shortname", "ReliefWeb") if sources else "ReliefWeb"
        created = (fields.get("date", {}).get("created") or "")[:10]
        items.append(
            {
                "id": f"rw-{entry.get('id')}",
                "country_code": iso3,
                "country_name": country_name,
                "title": fields.get("title", ""),
                "source": source_name,
                "source_url": fields.get("url", ""),
                "timestamp": created,
            }
        )
    return items


def fetch_reports(
    client: httpx.Client, appname: str, iso3: str, country_name: str, limit: int = 3
) -> list:
    """Latest report headlines for one country. Requires approved appname."""
    response = client.get(
        BASE_URL,
        params=[
            ("appname", appname),
            ("limit", limit),
            ("filter[field]", "primary_country.iso3"),
            ("filter[value]", iso3.lower()),
            ("sort[]", "date:desc"),
            ("fields[include][]", "title"),
            ("fields[include][]", "date.created"),
            ("fields[include][]", "url"),
            ("fields[include][]", "source.shortname"),
        ],
    )
    response.raise_for_status()
    return parse_reports(response.json(), iso3, country_name)
