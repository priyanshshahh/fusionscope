# FusionScope Code Audit

Honest review of the codebase as of `real-data` @ `2097e43`. This is a
documentation-only pass — nothing below has been fixed. Findings are ranked
by value-to-fix (user/reliability/security impact vs. effort), highest
first. Cross-references point at `docs/ARCHITECTURE.md` sections for context.

---

## 1. Alerts/Feed pages never touch the backend — the "honesty" invariant has a hole

**Where:** `src/pages/AlertsPage.tsx`, `src/pages/FeedPage.tsx`

Both pages `import { alerts } from '@/data/mockData'` / `import { feedItems }
from '@/data/mockData'` and filter/render that array only. There is no
`apiClient` call, no `DataSourceBadge`, nothing. Meanwhile `Dashboard.tsx`
correctly fetches `/api/alerts` and `/api/feed` and labels provenance
end-to-end (`ARCHITECTURE.md` §3). The net effect: a user can be looking at
`LIVE` data on the dashboard, click "ALERTS" or "FEED" in the nav, and land on
a page showing entirely fabricated demo content with zero indication it isn't
live — the exact failure mode ("hardcoded numbers presented as live
intelligence") the rest of this codebase was reworked to eliminate per
`docs/PROJECT-NOTES.md`. The backend endpoints these pages should be calling
already exist and are already tested (`test_alerts_carry_source_fields`,
`test_feed_respects_limit`).

**Value:** high — directly undermines the project's stated core value
(data honesty), on two of six nav destinations. **Effort:** low — the fetch
logic already exists twice (Dashboard.tsx, CountryDetail.tsx) as a pattern to
copy.

---

## 2. Refresh is not atomic — every 6-hour cron cycle has an empty-DB window

**Where:** `backend/app/etl/refresh.py::run_refresh`, lines ~207-297

```python
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
db = SessionLocal()
...
db.commit()
```

`drop_all`/`create_all` run as DDL directly against `engine`, separate from
and prior to the `db` session that inserts rows and commits once at the end.
Between the `create_all` and the final `db.commit()`, the tables exist but
are empty. Any HTTP request that lands in that window (`GET /api/countries`,
`/api/global-metrics`, etc.) gets a valid 200 with an empty list/fallback
zeroes rather than the previous (still-valid) data — a live user visiting
during the scheduled refresh sees the dashboard blank out and recover a
moment later, with no error to explain why. This happens on a predictable
6-hour cadence (`refresh-data.yml`), not as a rare race.

**Value:** high — production reliability issue, guaranteed to occur
repeatedly and predictably. **Effort:** medium — needs either a single
transaction spanning DDL+inserts (SQLite supports this), or a
build-in-shadow-table-then-swap approach; simplest fix is likely building the
new rows in memory/a staging table first and only doing `drop_all` +
insert + `commit` back-to-back with no request-serving gap, or wrapping the
whole function body in one `engine.begin()` context.

---

## 3. Error-detail leakage in every 500/502 response (known, flagged in the task brief)

**Where:** `backend/app/api/routes.py` — every route:
```python
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
```
and the refresh route: `raise HTTPException(status_code=502, detail=f"Refresh failed: {e}")`.

Any unhandled exception (a `SQLAlchemyError` with a connection string
fragment, an `httpx` error embedding an upstream URL, a Pydantic validation
error exposing internal field names) is serialized straight into the
client-visible JSON `detail` field. There's no distinction between
"safe to show" and "internal" exceptions, and no server-side logging
separate from the leaked text (i.e., the *only* record of the failure is
the string handed to the client).

**Value:** medium-high — real info-disclosure surface, trivial to trigger
(any transient DB/network hiccup), and the fix is uniform across every route.
**Effort:** low — one shared exception handler
(`@app.exception_handler(Exception)`) that logs the real exception and
returns a generic message would close all seven instances at once.

---

## 4. ETL: per-vector fallback exists, but per-source *outage* has no fallback at all

**Where:** `backend/app/etl/refresh.py::collect_live_scores`,
`build_alerts_and_feed`; `backend/app/etl/{worldbank,gdacs,unhcr}.py`

The whole system is built around a nice idea — if a source doesn't have a
value for a country, fall back to baseline and flag `estimated` — but that
logic only fires when a source **responds without a value**. If
`worldbank.fetch_indicator` (or GDACS, or UNHCR) raises — timeout, 5xx, DNS
failure, rate-limit — `response.raise_for_status()` propagates all the way up
through `collect_live_scores`/`build_alerts_and_feed`, uncaught, and the
*entire* refresh aborts. Compare to `reliefweb.fetch_reports`, which alone is
wrapped in `try/except httpx.HTTPError: continue` per-country. A transient
World Bank outage means zero live data gets refreshed for that whole 6-hour
cycle (the CLI catches `httpx.HTTPError` and exits 1 without touching the DB,
so the *previous* data stays live — which is the right failure mode — but
there's no partial degradation and no alerting: the operator only finds out
by noticing stale `updated_at` timestamps).

**Value:** medium — real resilience gap, but the current behavior (abort,
keep serving stale-but-valid data) is not catastrophic. **Effort:** medium —
would need per-source try/except around each of the three fetch calls in
`collect_live_scores`, falling back to "treat this source as fully
unavailable, flag all its vectors estimated for this run" — a bigger change
than it looks because `hazard_alert_levels`/`fetch_all` currently assume
their inputs succeeded.

---

## 5. Landing page still makes the claims the rest of the project explicitly disclaims

**Where:** `src/pages/Index.tsx`

The hero copy reads *"AI-powered convergence analysis tracking how climate
shocks... propagate into geopolitical and humanitarian crises in real-time"*,
under a permanently-pulsing **"INTELLIGENCE SYSTEM ACTIVE"** badge, with
hardcoded stats (`48` countries, `288` "Fusion Indicators" — the roster is
actually 60 countries per `seed_data/countries.py`/`mockData.ts`, so this
number is also just stale). `README.md` and `MethodologyPage.tsx` are explicit
that summaries are template-generated ("nothing here is an AI prediction")
and that data is point-in-time, not real-time. The honesty rework
(`DataSourceBadge`, `PROJECT-NOTES.md` §"Data honesty rules") never touched
this file — it's the first thing any visitor sees, and it contradicts every
other page.

**Value:** medium — visible to 100% of first-time visitors, and directly
undercuts the project's own stated principle. **Effort:** low — copy edit
plus fixing the stale `48`/`288` stat tiles.

---

## 6. Dead code: an entire data-fetching hook, and a nav component, unused

**Where:** `src/hooks/use-data-provider.ts`, `src/components/NavLink.tsx`

`use-data-provider.ts` exports `useDataProvider`, `useCountry`,
`useCountries`, `useGlobalMetrics`, `useApiHealth` — a generic
fetch-with-mock-fallback hook, clearly designed to be *the* data-fetching
pattern for this app. Nothing imports it (`grep` across `src/` for any of
those five names outside the file itself returns nothing). Instead,
`Dashboard.tsx` and `CountryDetail.tsx` each hand-roll their own near-copy of
the same fetch/fallback logic inline in a `useEffect`. `NavLink.tsx` is
similarly never imported anywhere. Two abandoned abstractions, ~150 lines,
sitting next to the working (duplicated) implementation.

**Value:** low-medium — no runtime impact, but it's a maintenance trap (the
next person who needs "fetch with fallback" will likely reach for the
existing hook, not realizing it's untested and unused). **Effort:** trivial —
delete both files, or wire `Dashboard.tsx`/`CountryDetail.tsx` to actually use
the hook and delete the inline duplicates instead.

---

## 7. `@tanstack/react-query` is fully wired up and fully unused

**Where:** `src/App.tsx` (`QueryClientProvider`), `package.json`

`App.tsx` constructs a `QueryClient` and wraps the entire route tree in
`QueryClientProvider`. No component anywhere calls `useQuery`/`useMutation` —
every data fetch in the app is a hand-rolled `useEffect` + `useState` (see
`Dashboard.tsx`, `CountryDetail.tsx`). The dependency, its provider, and the
`vite.config.ts` dedupe entry for it (`dedupe: [..., "@tanstack/react-query",
"@tanstack/query-core"]`) are all pure overhead — no caching, retries,
dedup-in-flight, or background refetch is actually happening anywhere,
despite the library that provides all of that for free being installed and
mounted.

**Value:** low-medium — bundle weight + a misleading signal to future
contributors that query caching is handled. **Effort:** low if removing;
medium if the intent is to actually adopt it (would also fix #6 for free,
since react-query's own hooks replace the need for the custom
`useDataProvider`).

---

## 8. `src/lib/api.ts`: eight copies of the same thirteen lines, all typed `any`

**Where:** `src/lib/api.ts`

`getGlobalMetrics`, `getCountries`, `getCountry`, `getCountrySummary`,
`getAlerts`, `getCountryAlerts`, `getFeed`, `getCountryFeed` are each:
```ts
try {
  const response = await this.fetchWithTimeout(endpoint);
  if (!response.ok) throw new Error("Failed to fetch X");
  const data = await response.json();
  return { data, status: "success" };
} catch (error) {
  return { error: ..., status: "error" };
}
```
with `Promise<ApiResponse<any>>` as the return type in every case, even
though the backend has fully-specified Pydantic schemas
(`CountryResponse`, `AlertResponse`, `FeedItemResponse`, `GlobalMetricsResponse`
in `backend/app/schemas/country.py`) that could be mirrored as TS interfaces
and used here instead of `any`. `fetchWithTimeout` already exists as the one
piece of shared logic — a single generic `request<T>(endpoint): Promise<ApiResponse<T>>`
would collapse all eight methods to one-liners and give the rest of the
frontend real type-checking on API payloads (which would have caught #9
below at compile time).

**Value:** medium — no bugs today, but zero type safety on every API
boundary in the app, and 8x the surface area for the next endpoint-shape
change to be missed in one call site. **Effort:** medium — mechanical
refactor, ~30 minutes.

---

## 9. Alerts/feed field-shape mismatch is band-aided with `??` fallbacks instead of a converter

**Where:** `src/lib/convert.ts` (only converts countries),
`src/pages/CountryDetail.tsx` (`alert.description ?? alert.summary`,
`item.severity ?? item.urgency`, `item.body ?? item.summary`)

`convertApiCountryToFrontend` exists precisely because the API is snake_case
and structurally different from the frontend's camelCase mock shapes. No
equivalent `convertApiAlertToFrontend` / `convertApiFeedItemToFrontend`
exists — `CountryDetail.tsx` instead reads both the mock shape's field names
(`description`, `severity`, `body`) and the live API's field names
(`summary`, `urgency`) off the same object with `??` chains, silently
tolerating whichever shape shows up rather than normalizing it once. This
works today because both shapes happen to be present as optional reads, but
it's fragile: `Dashboard.tsx`'s alerts widget sets raw API alerts into state
typed loosely enough that a genuine `Alert`-typed consumer would break on
`alert.countryId` (API sends `country_code`) — it currently only renders the
fields that happen to overlap (`title`, `severity`, `timestamp`).

**Value:** low-medium — currently masked by lucky field overlap and `??`
chains; a future change to either shape will fail silently (wrong text
displayed) rather than loudly. **Effort:** low — two small converter
functions alongside `convertApiCountryToFrontend`.

---

## 10. Duplicated demo dataset — three independent copies of the same 60 countries' numbers

**Where:** `backend/seed_data/countries.py`, `src/data/mockData.ts`,
and (dead weight within the first) each entry's unused `"summary"` field

The demo baseline risk numbers for all 60 countries are hand-typed twice —
once in the backend seed data, once in the frontend mock data — with no
shared source, so a future edit to one (e.g., adjusting Somalia's
`water_stress` from 92) silently diverges from the other. Compounding this:
every entry in `backend/seed_data/countries.py` carries a `"summary"` string
field that is **never read** — `refresh.py::build_summary()` generates its
own deterministic summary from the scores at refresh time and ignores
`entry["summary"]` entirely (confirmed: no reference to `entry["summary"]`
anywhere in `refresh.py`). That's 60 hand-written paragraphs of dead data
sitting in the seed file. `mockData.ts` separately runs its own
`generateSummary()` template function, a third independent implementation of
"turn scores into prose" alongside `build_summary()` in the backend and the
unused strings in `seed_data`.

**Value:** medium — three sources of truth for what should be one demo
dataset; drift risk grows every time either file is touched, and 60 dead
strings are pure noise for anyone reading `seed_data/countries.py` top to
bottom. **Effort:** medium — the seed data could be exported to a shared
JSON consumed by both sides (build step), or the frontend could fetch demo
data through the same `/api/countries?demo=1`-style path instead of
maintaining its own copy; removing the unused `summary` field is a
five-minute cleanup regardless.

---

## Ponytail check: is the three.js globe justified?

**Where:** `src/components/GlobeMap.tsx`, `package.json`
(`three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`)

What it renders: a textured sphere, a manually-rotated group (`useFrame`
incrementing `rotation.y` every frame — duplicating functionality
`OrbitControls` already offers via its own `autoRotate` prop, unused here),
custom lat/lon-to-3D-vector math, hand-built graticule lines, and 60 clickable
marker spheres colored by severity. Per `docs/PROJECT-NOTES.md`'s own
verification pass, the production bundle is **1.64 MB minified / 456 KB
gzip**, and three.js is called out there as the dominant contributor, with
"code-splitting the globe" already flagged as "the first performance
follow-up" — i.e., the team already knows this is the heaviest part of the
app.

The information actually conveyed — a country's location and one color-coded
severity value — does not structurally require 3D: an SVG/Canvas world map
(or even a sorted list, which the "Instability Ranking" panel already
provides right next to the globe) would communicate the same data at a
fraction of the dependency weight, with far simpler interaction code (no
camera/lighting/orbit-control tuning, no manual vector math, no WebGL context
management). The globe is visually the centerpiece of the product and likely
the reason this exists as a demo/portfolio piece — so this isn't a
"delete it" call, but it is worth naming explicitly: this is the single
largest bundle-size and complexity line item in the frontend, for a payload
of "60 dots with a color," and it duplicates at least one feature
(auto-rotation) that its own dependency provides for free. If load time or
maintenance cost ever becomes a real constraint, this is where to look first.

**Value:** low-medium as a "fix" (it's a product/aesthetic choice, not a
bug) but high awareness value — anyone doing a performance pass should know
this is where the budget goes. **Effort:** N/A — this is a call for a
product decision, not a mechanical fix.

---

## Other things noticed, not ranked (lower value or already covered above)

- `MetricsService.get_global_metrics` (backend/app/services/__init__.py)
  recomputes `critical`/`elevated`/`avg_fusion`/`top_hotspot` from scratch as
  a fallback when no `GlobalMetrics` row exists — the exact same aggregation
  `run_refresh` already computes and stores. Two independent implementations
  of one aggregation.
- `GET /api/health` swallows *all* exceptions (`except Exception: pass`) to
  avoid failing on an empty DB — this also silently hides genuine DB
  connectivity failures behind a `"status": "healthy"` response with null
  provenance fields.
- `backend/app/core/config.py` mixes `pydantic_settings.BaseSettings` (which
  can bind env vars natively) with a second, manual block of
  `if os.getenv(...): settings.x = ...` overrides right below it — two
  config-loading mechanisms doing overlapping work in one 46-line file.
- `render.yaml` pins `PYTHON_VERSION: 3.13.1`, while CI and the README both
  pin/require 3.12 (a 3.13 venv is documented in `PROJECT-NOTES.md` as
  failing to build `pydantic-core` from source) — the deploy config
  contradicts the documented supported version.
- Frontend test coverage has no tests for `GlobeMap.tsx`, `Dashboard.tsx`'s
  fetch orchestration, `CountryDetail.tsx`, or either mock-only page —
  coverage is concentrated on the scoring/conversion/badge logic (which is
  the right priority, but the fetch-orchestration bugs above would have been
  easy to catch with even a shallow render test).
