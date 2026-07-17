# Project Notes

Design decisions, tradeoffs, and known limitations. The short version: this
project started as a generated prototype with hardcoded numbers presented as
live intelligence; it was reworked to pull real data, label everything that
is not real, and delete the claims that were never true.

## Data honesty rules

1. Every country row carries `data_source` (`live` | `demo`); the UI badge
   is derived from the payload, never hardcoded.
2. In live mode, any vector that had no live indicator is listed in
   `estimated_vectors` and disclosed in the UI and the summary text.
3. No fabricated series: the old UI generated 12-month "trends" with
   `Math.random()` per render. Live data now shows a "no history yet" note
   instead; demo trend charts are titled "(demo data)".
4. Summaries are deterministic templates over the actual scores. They were
   previously labeled "AI Insights"; they are not AI output and are now
   called Situation Summary.

## Source and mapping choices

- **World Bank** was chosen over fancier sources because it is keyless,
  stable, and auditable. Mappings (in `backend/app/etl/scoring.py`, mirrored
  on the Methodology page): water stress = ER.H2O.FWST.ZS clamped at 100;
  food insecurity = SN.ITK.DEFC.ZS x 2.5 (40%+ undernourishment -> 100);
  infrastructure fragility = 100 - EG.ELC.ACCS.ZS. The last one is a
  structural proxy, not an outage feed - disclosed as such.
- **GDACS** drives drought/flood via active events in a 180-day window
  (Red 92 / Orange 68 / Green 42, max wins). No active event means we fall
  back to the curated baseline and flag `estimated`, because "no event" is
  not evidence of "no structural risk". Event-type -> vector mapping
  (TC -> flood; EQ/VO/WF -> infrastructure) is a documented judgment call.
- **UNHCR** displacement totals (refugees + asylum seekers + IDPs by country
  of origin) on a log scale: 10k -> 40, 1M -> 80, 10M -> 100. Falls back
  up to two publication years because UNHCR data lags.
- **ReliefWeb** is fully implemented but env-gated: the v2 API requires an
  approved appname, which must be requested manually. Shipping with it off
  is more honest than scraping around the restriction.

## Architecture notes

- The fusion formula exists in exactly two places by design: `scoring.py`
  (backend truth) and `src/data/types.ts` (frontend mirror for offline demo
  mode). Both sides have tests asserting the same weights and severity
  bands, so drift fails CI rather than silently diverging.
- ETL modules are split into pure parsers + thin fetch wrappers, so tests
  run on recorded fixtures (in `backend/tests/fixtures/`, captured from the
  real APIs) with zero network.
- SQLite is deliberate: one file, rebuilt atomically by refresh, trivially
  seeded in CI and Docker builds. The dataset is 60 countries; a "real"
  database would be resume-driven complexity.
- The refresh endpoint uses a shared token (`hmac.compare_digest`) rather
  than a user system - there is exactly one machine caller (the cron
  workflow) and no user accounts.

## Known limitations

- No historical storage, so no real trends yet. The obvious next step is an
  append-only `score_snapshots` table written on each refresh.
- Three sources cover six vectors; drought/flood outside GDACS windows and
  migration for countries UNHCR lags on are baseline-estimated (flagged).
- The curated baseline itself is hand-authored prior knowledge, useful as a
  fallback and demo, but not a measurement - which is why it is labeled
  everywhere.
- GDACS alert titles like "Earthquake in China" are terse; ReliefWeb (once
  an appname is approved) gives much richer feed content.
- Frontend bundle is ~1.6 MB minified (three.js dominates); code-splitting
  the globe is the first performance follow-up.

## Verification (2026-07-17)

Final pass before handoff to deploy. All numbers below are from real runs
on this machine, not estimates.

- **Backend tests**: `cd backend && python -m pytest -q` (Python 3.12 venv,
  `.venv/`, gitignored) -> **30 passed**, 0 failed, 6 deprecation warnings
  (Pydantic v2 config style, FastAPI `on_event`) in 3.94s. No fixes needed.
  Note: a `python3.13` venv fails to build `pydantic-core==2.16.2` from
  source on this machine (`ForwardRef._evaluate()` signature change in
  3.13 breaks the pinned pydantic-core's build script) — use 3.12, as the
  README already instructs.
- **Frontend build**: `npm run build` -> succeeds, `vite v5.4.19`, 3060
  modules transformed, `dist/assets/index-*.js` 1,641.05 kB (456.52 kB
  gzip) in 39.04s. One expected chunk-size warning (three.js), no errors.
- **Live ETL refresh**: `python -m app.etl.refresh` run against the real,
  keyless World Bank, GDACS, and UNHCR APIs (ReliefWeb stayed off — no
  `RELIEFWEB_APPNAME` set, by design). Result printed by the script:
  `{'data_source': 'live', 'countries': 60, 'alerts': 93, 'feed_items': 93,
  'refreshed_at': '2026-07-17T04:31:26Z'}`. Querying the rebuilt
  `fusionscope.db` directly:
  - All 60 countries wrote `data_source='live'`.
  - Per-vector live coverage across the 60-country roster: water_stress and
    infrastructure_disruption vectors had **zero** fallbacks (World Bank
    answered for all 60); food_insecurity fell back for 3/60; drought fell
    back for 42/60 and flood for 32/60 (GDACS only reports *active* events,
    so most countries had none in the 180-day window and used the flagged
    baseline, exactly as documented above); migration_pressure fell back
    for 29/60 (UNHCR publication lag).
  - 8/60 countries had zero estimated vectors (fully live on every vector
    this run).
  - `alerts` and `feed_items` are both 93 rows, all `source='GDACS'`
    (ReliefWeb off this run, as expected).
  - Fusion score spread: min 20.0, max 79.0, avg 42.72. Severity buckets:
    1 critical, 9 high, 31 elevated, 19 low. Top hotspot: Sudan (SDN).
  - Conclusion: the ETL is genuinely hitting live World Bank / GDACS /
    UNHCR endpoints and producing real, varying per-country data — this is
    not fixture playback (fixtures are only read by pytest, never by
    `app.etl.refresh`).
- **UI/docs honesty re-check**: confirmed by reading the current source,
  not by memory of past claims.
  - `DataSourceBadge` (`src/components/DataSourceBadge.tsx`) derives LIVE /
    DEMO DATA / OFFLINE-DEMO purely from the `data_source`/reachability
    status passed in — no hardcoded badge.
  - No `Math.random()` remains in any data/trend path. The one remaining
    `Math.random()` in the repo is in `src/components/ui/sidebar.tsx`
    (stock shadcn/ui loading-skeleton width jitter, unrelated to
    application data — cosmetic loading placeholder only).
  - `CountryDetail.tsx`: when a country has no `trend` history it renders
    "A trend chart will appear once score history accumulates across
    refreshes" instead of a chart; when demo trend data is shown the card
    is titled "12-Month Fusion Score Trend (demo data)".
  - README's "What is real and what is not" section and the in-app
    Methodology page match the actual ETL behavior verified above; no
    "540K users"-style fabricated claims or phantom-CI badges found.
- **Deploy status**: not done in this pass — Render (backend) and Vercel
  (frontend) both require the owner to log in interactively; AWS S3
  snapshot storage (per campaign spec) also needs owner AWS credentials.
  `render.yaml` and `vercel.json` are committed and ready; this is the only
  remaining blocker to a live public deployment.
