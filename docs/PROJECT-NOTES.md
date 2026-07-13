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
