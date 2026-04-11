# FusionScope - Quick Start Guide

## 🚀 Get Running in 3 Minutes

### Prerequisites
- Python 3.10+ with pip
- Node.js/Bun for frontend
- Terminal/bash

### Start Backend

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Seed database
python -m scripts.seed

# Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

✅ Backend ready at `http://localhost:8000`

### Start Frontend

```bash
# In project root

# Set environment variable to connect to backend
export VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
# or
bun run dev
```

✅ Frontend ready at `http://localhost:8080`

### Verify Everything Works

1. Open `http://localhost:8080` in browser
2. Dashboard should load with:
   - Global metrics (active alerts, critical regions, etc.)
   - World map with country markers
   - Top crisis-ranked countries list
3. Click a country → Country detail page loads with alerts & feed
4. Open browser DevTools → Console tab to see API calls

### Data Flow

```
Frontend (http://localhost:8080)
         ↓
    API Client (src/lib/api.ts)
         ↓
    Backend (http://localhost:8000)
         ↓
    SQLite Database (backend/fusionscope.db)
         ↓
    48 Seeded Countries with Risk Data
```

### If Backend is Unavailable

✅ Don't worry! Frontend will automatically fallback to mock data:
- Dashboard still loads
- Country data still available
- No broken UI

## 📊 What's Included

**Backend:**
- ✅ 48 seeded countries
- ✅ Automatic alert generation (238 alerts)
- ✅ Automatic feed generation (452 feed items)
- ✅ 7 REST API endpoints
- ✅ SQLite database
- ✅ CORS enabled
- ✅ Auto-seeding on startup

**Frontend:**
- ✅ API client with fallback
- ✅ Dashboard integration
- ✅ Country detail integration
- ✅ Graceful error handling
- ✅ Environmental configuration

## 🔧 Configuration

### Backend Environment (.env)

```env
# Database
DATABASE_URL=sqlite:///./fusionscope.db

# Server
DEBUG=True
HOST=0.0.0.0
PORT=8000
```

### Frontend Environment (.env.local)

```env
# API Backend
VITE_API_BASE_URL=http://localhost:8000
```

## 📚 Documentation

- **Backend**: See `backend/README.md`
- **Integration**: See `INTEGRATION_GUIDE.md`
- **API Docs**: Open `http://localhost:8000/docs` (Swagger UI)

## 🧪 Test an Endpoint

```bash
# Health check
curl http://localhost:8000/api/health

# Get global metrics
curl http://localhost:8000/api/global-metrics

# Get all countries
curl http://localhost:8000/api/countries | jq .

# Get specific country
curl http://localhost:8000/api/country/SOM | jq .
```

## ⚡ Quick Troubleshooting

**Backend won't start?**
```bash
# Delete database and reseed
rm backend/fusionscope.db
python -m scripts.seed
```

**Port already in use?**
```bash
# Use different port
uvicorn app.main:app --port 8001
# Update VITE_API_BASE_URL to :8001
```

**CORS error in frontend?**
```bash
# Check backend is running:
curl http://localhost:8000/api/health
# Should return: {"status":"healthy",...}
```

**Frontend not connecting to backend?**
```bash
# Check .env.local:
cat .env.local
# Should have: VITE_API_BASE_URL=http://localhost:8000
```

## 📱 Default Data

**48 Countries** seeded with risk indicators:
- Critical zones: Somalia, Yemen, Syria, Afghanistan, Sudan
- High risk: Iraq, Chad, Jordan, etc.
- Elevated: Kenya, Nigeria, India, Philippines
- Stable: Germany, Japan, Australia, etc.

**Automatically Generated:**
- 238 alerts (from high-risk indicators)
- 452 feed items (intelligence synthesis)
- Global metrics (aggregated scores)

## 🎯 Next Steps

1. ✅ Backend running with seeded data
2. ✅ Frontend connected to backend
3. → Explore dashboard with real data
4. → Click through countries
5. → Test alerts and feed pages
6. → Ready for deployment!

## 📦 Deployment

See `backend/README.md` for production deployment steps including:
- Docker containerization
- PostgreSQL setup
- Reverse proxy configuration
- Environment hardening

---

**Status**: ✅ Ready for Local Development & Hackathon  
**Last Updated**: April 11, 2026
