# FusionScope Backend

**Global Crisis Fusion Dashboard API**

FastAPI-based backend for tracking how climate and water shocks propagate into geopolitical and humanitarian stress across 48 countries.

## Features

✅ **Fusion Score Algorithm**: Weighted calculation across 6 risk dimensions  
✅ **48 Seeded Countries**: Realistic demo data with mapped risk indicators  
✅ **Complete REST API**: 7 core endpoints for dashboard integration  
✅ **SQLite Database**: Production-ready with automatic schema creation  
✅ **CORS Enabled**: Ready for local and deployed frontend integration  
✅ **Severity Bands**: 4-tier classification (low, elevated, high, critical)  
✅ **Alert & Feed Generation**: Automatic intelligence synthesis  

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Seed Database

```bash
python -m scripts.seed
```

Output:
```
✓ Seeded 48 countries
✓ Generated 238 alerts
✓ Generated 452 feed items
✓ Global metrics initialized
✓ Database seeding complete!
```

### 3. Run Server

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Access the API:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health
- **Root**: http://localhost:8000

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI app with CORS setup
│   ├── api/
│   │   └── routes.py     # All API endpoints
│   ├── models/
│   │   └── country.py    # SQLAlchemy ORM models
│   ├── schemas/
│   │   └── country.py    # Pydantic response schemas
│   ├── services/
│   │   └── __init__.py   # Business logic (Country, Alert, Feed, Metrics services)
│   ├── core/
│   │   └── config.py     # Settings and environment config
│   └── db/
│       └── database.py   # SQLAlchemy engine + session management
├── seed_data/
│   └── countries.py      # 48 seeded countries with risk data
├── scripts/
│   └── seed.py           # Database seeding script
├── requirements.txt
├── .env                  # Local development config
├── .env.example          # Template for deployment
└── README.md
```

## API Endpoints

### Health & Root

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/health` | Health check (no auth needed) |
| GET | `/` | API information and docs links |

### Global Metrics

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/global-metrics` | Dashboard summary: active alerts, critical regions, avg fusion score, top hotspot |

### Countries

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/countries` | All 48 countries with risk profiles |
| GET | `/api/country/{code}` | Country detail by code (e.g., `/api/country/SOM`) |
| GET | `/api/summary/{code}` | AI summary for country |

### Alerts & Feed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/alerts` | All active alerts (sorted by severity) |
| GET | `/api/feed` | Global intelligence feed (paginated) |
| GET | `/api/country/{code}/alerts` | Alerts for a specific country |
| GET | `/api/country/{code}/feed` | Feed items for a specific country |

## Data Models

### Country

```json
{
  "code": "SOM",
  "name": "Somalia",
  "region": "East Africa",
  "lat": 5.15,
  "lon": 46.2,
  "risks": {
    "water_stress": 92,
    "drought": 88,
    "flood": 45,
    "food_insecurity": 95,
    "migration_pressure": 87,
    "infrastructure_disruption": 82
  },
  "fusion_score": 86.15,
  "severity": "critical",
  "ai_summary": "...",
  "updated_at": "2025-04-11T..."
}
```

### Fusion Score Formula

```
fusion_score = 
  0.25 * water_stress +
  0.20 * drought +
  0.20 * flood +
  0.15 * food_insecurity +
  0.10 * migration_pressure +
  0.10 * infrastructure_disruption
```

### Severity Bands

- **0–24**: low
- **25–49**: elevated
- **50–74**: high
- **75–100**: critical

## Environment Configuration

### Local Development (.env)

```env
DATABASE_URL=sqlite:///./fusionscope.db
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### Production (.env)

```env
DATABASE_URL=postgresql://user:password@localhost/fusionscope
DEBUG=False
HOST=0.0.0.0
PORT=8000
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

## Deployment

### Standard Deployment

```bash
# Install
pip install -r requirements.txt

# Seed database
python -m scripts.seed

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
RUN python -m scripts.seed
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Behind Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name api.fusionscope.example.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Database

### SQLite (Default - Development)

```bash
# Automatic schema creation
python -m scripts.seed

# View database
sqlite3 fusionscope.db ".tables"
```

### PostgreSQL (Production)

```bash
# Update .env
DATABASE_URL=postgresql://user:password@localhost:5432/fusionscope

# Create database
createdb fusionscope

# Seed
python -m scripts.seed

# Run
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## CORS Configuration

By default, CORS is enabled for:
- `http://localhost:8080` (Vite frontend)
- `http://localhost:3000` (Alternative port)
- `http://127.0.0.1:8080`
- `http://127.0.0.1:3000`

Set `ALLOWED_ORIGINS` as a comma-separated list in your environment:

```env
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://your-custom-domain.com
```

## Testing

```bash
# With curl
curl http://localhost:8000/api/global-metrics
curl http://localhost:8000/api/countries
curl http://localhost:8000/api/country/SOM

# With httpie
http GET localhost:8000/api/global-metrics
http GET localhost:8000/api/countries
```

## Troubleshooting

### Database Lock Error

```
sqlite3.OperationalError: database is locked
```

**Solution**: Delete `fusionscope.db` and reseed:
```bash
rm fusionscope.db
python -m scripts.seed
```

### CORS Error in Frontend

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Ensure `ALLOWED_ORIGINS` includes your frontend domain

### Port Already in Use

```bash
# Use different port
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

## API Response Patterns

### Success (200)

```json
{
  "code": "SOM",
  "name": "Somalia",
  ...
}
```

### Not Found (404)

```json
{
  "detail": "Country not found"
}
```

### Server Error (500)

```json
{
  "detail": "Internal server error message"
}
```

## Performance Notes

- **Countries endpoint**: ~0ms (in-memory query)
- **Global metrics**: ~0ms (cached calculation)
- **Alerts endpoint**: ~5ms (sorted query)
- **Feed endpoint**: ~10ms (paginated query)

## Future Enhancements

- [ ] Real-time data streaming (WebSocket)
- [ ] Historical tracking (time-series analysis)
- [ ] Custom alerting rules
- [ ] Multi-language support
- [ ] User authentication & authorization
- [ ] Advanced filtering & search
- [ ] Data export (CSV, JSON, PDF)
- [ ] Predictive modeling

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or contributions, please refer to the main project repository.

---

**Last Updated**: April 11, 2026  
**Version**: 1.0.0  
**Status**: Production Ready ✓
