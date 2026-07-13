# FusionScope

A global crisis-risk dashboard: six risk vectors per country (water stress,
drought, flood, food insecurity, migration pressure, infrastructure
fragility) fused into one weighted 0-100 instability score, rendered on an
interactive 3D globe.

**What is real and what is not** (also on the in-app Methodology page):

- **Live mode** scores countries from three open, keyless APIs:
  [World Bank indicators](https://data.worldbank.org) (water stress,
  undernourishment, electricity access), [GDACS](https://www.gdacs.org)
  disaster events (drought/flood, plus the alerts and feed with links to the
  original reports), and the
  [UNHCR Refugee Data Finder](https://api.unhcr.org) (displacement totals).
  Vectors with no live source fall back to a curated baseline and are
  flagged `estimated` per country.
- **Demo mode** is a curated baseline dataset. The UI labels it `DEMO DATA`;
  it is never presented as live measurement.
- Country summaries are template-generated from the scores. There is no
  satellite, sensor, or NLP pipeline, and nothing here is an AI prediction.

## Stack

React 18 + TypeScript + Vite + Tailwind (three.js globe, recharts) /
FastAPI + SQLAlchemy + SQLite / httpx ETL / pytest + vitest / GitHub Actions.

## Run it

Backend (Python 3.12+):

```sh
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
python -m app.etl.refresh          # live data (or: --demo for offline)
uvicorn app.main:app --reload      # http://localhost:8000/docs
```

Frontend:

```sh
npm install
npm run dev                        # http://localhost:8080
```

The frontend works without the backend (bundled demo data, labeled
`OFFLINE · DEMO`). Point it at a deployed backend with
`VITE_API_BASE_URL` (see `.env.local.example`).

## Tests

```sh
cd backend && python -m pytest tests   # scoring, ETL parsers (recorded fixtures), API
npm test                                # fusion parity, converter, provenance badges
```

## Data pipeline

`backend/app/etl/` — one module per source plus `scoring.py` (the fusion
formula and all normalization mappings, mirrored in `src/data/types.ts`) and
`refresh.py` (orchestrator). Refresh paths:

- `python -m app.etl.refresh` locally or at deploy time
- `POST /api/refresh` with `X-Refresh-Token` (set `REFRESH_TOKEN`)
- `.github/workflows/refresh-data.yml` cron hits that endpoint every 6 hours

Scores are point-in-time; no historical series is stored yet, so the UI
shows trend charts only for demo data (labeled). Optional: set
`RELIEFWEB_APPNAME` (requires [ReliefWeb approval](https://apidoc.reliefweb.int))
to add real humanitarian report headlines to the feed.

## Deploy

- Backend: `render.yaml` (Render) or `backend/Dockerfile` anywhere.
  Set `ALLOWED_ORIGINS` to the frontend origin.
- Frontend: `vercel.json` (SPA rewrites); set `VITE_API_BASE_URL`.
- CI: `.github/workflows/ci.yml` runs both test suites and the build.

Design notes and known limitations: [docs/PROJECT-NOTES.md](docs/PROJECT-NOTES.md).
