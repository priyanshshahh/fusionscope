# 📊 FusionScope - Project Documentation

Complete technical documentation for the FusionScope Global Crisis Fusion Dashboard.

---

## 🎯 Project Overview

FusionScope is a production-grade full-stack application that combines real-time geopolitical data with advanced risk analysis to provide comprehensive global crisis monitoring. The proprietary fusion algorithm synthesizes multiple crisis indicators into a unified risk score.

### Key Objectives
1. **Real-time Monitoring**: Track 60+ countries for crisis indicators
2. **Risk Analysis**: Calculate fusion scores from 6 risk dimensions
3. **Actionable Intelligence**: Prioritize humanitarian response resources
4. **Seamless Integration**: API-first architecture with automatic fallbacks
5. **Production Ready**: Enterprise-grade security, performance, monitoring

---

## 🏗️ System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────────────────────┐
│         PRESENTATION LAYER (React Frontend)         │
│  - Dashboard Component                              │
│  - Country Detail Pages                             │
│  - Alerts & Feed Display                            │
│  - Type-Safe API Client                             │
└──────────────────┬──────────────────────────────────┘
                   │ REST / JSON
                   │
┌──────────────────▼──────────────────────────────────┐
│         APPLICATION LAYER (FastAPI Backend)         │
│  - Route Handlers (7 endpoints)                      │
│  - Business Logic Services                          │
│  - Data Validation (Pydantic)                       │
│  - Error Handling & CORS                            │
└──────────────────┬──────────────────────────────────┘
                   │ ORM / SQL
                   │
┌──────────────────▼──────────────────────────────────┐
│         DATA LAYER (SQLAlchemy + SQLite)            │
│  - Country Model (60 records)                        │
│  - Alert Model (201+ records)                        │
│  - Feed Item Model (259+ records)                    │
│  - Global Metrics Aggregation                       │
└─────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
User Action (Dashboard Open)
         ↓
    useEffect Hook
         ↓
   API Client Call
    (5s timeout)
         ↓
    ┌────┴─────┐
    ↓          ↓
  SUCCESS   TIMEOUT/ERROR
    ↓          ↓
  API Data  Use Mock Data
    ↓          ↓
    └────┬─────┘
         ↓
   Data Conversion
   (snake_case → camelCase)
         ↓
    React State Update
         ↓
    Component Re-render
         ↓
    User Sees Dashboard
```

---

## 🧮 Fusion Algorithm

The core innovation of FusionScope is its proprietary fusion algorithm that combines multiple crisis indicators.

### Algorithm Formula

```
Fusion Score = W₁×WS + W₂×DR + W₃×FL + W₄×FI + W₅×MP + W₆×ID

Where:
  W₁ = 0.25 (Water Stress Weight)
  W₂ = 0.20 (Drought Weight)
  W₃ = 0.20 (Flood Weight)
  W₄ = 0.15 (Food Insecurity Weight)
  W₅ = 0.10 (Migration Pressure Weight)
  W₆ = 0.10 (Infrastructure Disruption Weight)

  WS = Water Stress Score (0-100)
  DR = Drought Score (0-100)
  FL = Flood Score (0-100)
  FI = Food Insecurity Score (0-100)
  MP = Migration Pressure Score (0-100)
  ID = Infrastructure Disruption Score (0-100)
```

### Example Calculation

**Somalia:**
```
Fusion Score = (0.25 × 92) + (0.20 × 88) + (0.20 × 45) 
             + (0.15 × 95) + (0.10 × 78) + (0.10 × 83)
             = 23.00 + 17.60 + 9.00 + 14.25 + 7.80 + 8.30
             = 79.95 ≈ 80.0
Classification: CRITICAL
```

### Severity Bands

| Band | Range | Color | Response Level |
|------|-------|-------|-----------------|
| **Low** | 0-24 | 🟢 Green | Monitor |
| **Elevated** | 25-49 | 🟡 Yellow | Watch |
| **High** | 50-74 | 🟠 Orange | Alert |
| **Critical** | 75-100 | 🔴 Red | Emergency |

### Risk Vector Definitions

#### 1. Water Stress (25% weight)
- Measures water scarcity and competition for water resources
- Factors: Rainfall, water table decline, competition with agriculture
- Impact: Conflict over water, migration, irrigation failure

#### 2. Drought (20% weight)
- Extended periods of abnormally low rainfall
- Factors: Precipitation anomaly, soil moisture, vegetation health
- Impact: Crop failure, food security, livestock loss

#### 3. Flood (20% weight)
- Excessive water causing overflow of normal boundaries
- Factors: Extreme precipitation, river levels, flood history
- Impact: Infrastructure damage, displacement, disease

#### 4. Food Insecurity (15% weight)
- Lack of reliable access to sufficient nutritious food
- Factors: Production, distribution, purchasing power, malnutrition
- Impact: Humanitarian needs, social unrest, migration

#### 5. Migration Pressure (10% weight)
- Internal and cross-border population displacement forces
- Factors: Conflict, economic opportunity, climate events
- Impact: Border strain, resource competition, social tension

#### 6. Infrastructure Disruption (10% weight)
- Damage or breakdown of critical infrastructure systems
- Factors: Power grid reliability, transport networks, healthcare
- Impact: Aid delivery issues, economic disruption, disease spread

---

## 📁 Codebase Structure

### Backend Structure

```
backend/
├── app/
│   ├── __init__.py                          # Package initialization
│   ├── main.py (152 lines)                  # FastAPI app, CORS, startup
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py (320 lines)           # 7 REST endpoints
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── country.py (180 lines)          # SQLAlchemy ORM models
│   │                                        # - Country
│   │                                        # - Alert
│   │                                        # - FeedItem
│   │                                        # - GlobalMetrics
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── country.py (150 lines)          # Pydantic response schemas
│   │                                        # - RiskScores
│   │                                        # - CountryResponse
│   │                                        # - AlertResponse
│   │                                        # - etc.
│   │
│   ├── services/
│   │   ├── __init__.py (280 lines)         # Business logic services
│   │                                        # - CountryService
│   │                                        # - AlertService
│   │                                        # - FeedService
│   │                                        # - MetricsService
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   └── config.py (40 lines)            # Settings, CORS config
│   │
│   └── db/
│       ├── __init__.py
│       └── database.py (25 lines)          # SQLAlchemy setup
│
├── scripts/
│   └── seed.py (180 lines)                 # Database seeding script
│
├── seed_data/
│   ├── __init__.py
│   └── countries.py (400 lines)            # 60 countries with data
│
├── requirements.txt                         # Python dependencies
├── .env                                     # Environment variables
├── .env.example                             # Environment template
└── fusionscope.db                          # SQLite database
```

### Frontend Structure

```
src/
├── components/
│   ├── GlobeMap.tsx                        # 3D globe visualization
│   ├── MetricCard.tsx                      # Metric display card
│   ├── NavLink.tsx                         # Navigation link
│   ├── SeverityBadge.tsx                   # Severity indicator
│   ├── TerminalCard.tsx                    # Feed item display
│   └── ui/
│       ├── button.tsx                      # shadcn/ui components
│       ├── card.tsx
│       ├── badge.tsx
│       ├── dialog.tsx
│       ├── table.tsx
│       └── ... (30+ components)
│
├── pages/
│   ├── Dashboard.tsx (180 lines)           # Main dashboard (API integrated)
│   ├── CountryDetail.tsx (220 lines)       # Country detail (API integrated)
│   ├── AlertsPage.tsx (120 lines)          # Alerts listing
│   ├── FeedPage.tsx (120 lines)            # Crisis feed
│   ├── MethodologyPage.tsx (100 lines)     # Algorithm explanation
│   ├── NotFound.tsx (30 lines)             # 404 page
│   └── Index.tsx (50 lines)                # Route index
│
├── lib/
│   ├── api.ts (220 lines)                  # API client with fallback
│   └── utils.ts (50 lines)                 # Utility functions
│
├── hooks/
│   ├── use-mobile.tsx                      # Mobile detection
│   ├── use-toast.ts                        # Toast notifications
│   └── use-data-provider.ts (100 lines)   # Custom fetch hooks
│
├── data/
│   ├── mockData.ts (2000+ lines)           # Fallback mock data
│   └── types.ts (80 lines)                 # TypeScript interfaces
│
├── App.tsx (80 lines)                      # Main app component
├── main.tsx (20 lines)                     # React entry point
└── index.css                               # Global styles
```

---

## 🔌 API Endpoints

### 1. Health Check
```
GET /api/health
Response: { "status": "healthy", "service": "FusionScope Backend" }
Purpose: Verify backend is responding
```

### 2. Global Metrics
```
GET /api/global-metrics
Response: {
  "active_alerts": 201,
  "critical_countries": 5,
  "elevated_countries": 24,
  "avg_fusion_score": 57.75,
  "top_hotspot": "SSD"
}
Purpose: Dashboard KPIs
```

### 3. All Countries
```
GET /api/countries
Response: [{
  "code": "SOM",
  "name": "Somalia",
  "severity": "critical",
  "fusion_score": 81.0,
  "risks": {
    "water_stress": 92,
    "drought": 88,
    "flood": 45,
    "food_insecurity": 95,
    "migration_pressure": 78,
    "infrastructure_disruption": 83
  }
}, ...]
Purpose: List all countries with risk data
```

### 4. Country Detail
```
GET /api/country/{code}
Example: /api/country/SOM
Response: { ...same as above... }
Purpose: Get specific country details
```

### 5. All Alerts
```
GET /api/alerts
Response: [{
  "id": 1,
  "country_code": "SOM",
  "title": "Severe Water Stress Alert",
  "description": "...",
  "severity": "critical",
  "created_at": "2026-04-11T12:00:00"
}, ...]
Purpose: Get all crisis alerts
```

### 6. Feed Items
```
GET /api/feed?limit=50
Response: [{
  "id": 1,
  "country_code": "SOM",
  "title": "Food Price Crisis in Somalia",
  "description": "...",
  "event_type": "food_insecurity",
  "created_at": "2026-04-11T11:00:00"
}, ...]
Purpose: Get paginated crisis feed
```

### 7. Country-Specific Data
```
GET /api/country/{code}/alerts
GET /api/country/{code}/feed
Purpose: Get alerts/feed for specific country
```

---

## 💾 Database Schema

### Country Table
```sql
CREATE TABLE country (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code VARCHAR(3) UNIQUE NOT NULL,           -- ISO 3166-1 alpha-3
  name VARCHAR(100) NOT NULL,
  water_stress_score INTEGER,                 -- 0-100
  drought_score INTEGER,                      -- 0-100
  flood_score INTEGER,                        -- 0-100
  food_insecurity_score INTEGER,              -- 0-100
  migration_pressure_score INTEGER,           -- 0-100
  infrastructure_disruption_score INTEGER,    -- 0-100
  overall_fusion_score FLOAT,                 -- Calculated score
  severity VARCHAR(20),                       -- low|elevated|high|critical
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Alert Table
```sql
CREATE TABLE alert (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code VARCHAR(3) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL,
  risk_category VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(country_code) REFERENCES country(code)
);
```

### Feed Item Table
```sql
CREATE TABLE feed_item (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  country_code VARCHAR(3) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_type VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(country_code) REFERENCES country(code)
);
```

### Global Metrics Table
```sql
CREATE TABLE global_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  active_alerts INTEGER,
  critical_countries INTEGER,
  elevated_countries INTEGER,
  avg_fusion_score FLOAT,
  top_hotspot VARCHAR(3),
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔐 Security Considerations

### CORS Configuration
```python
# backend/app/main.py
allowed_origins = [
    "http://localhost:8080",
    "http://localhost:3000",
    "http://127.0.0.1:8080",
    "http://127.0.0.1:3000",
    # Production: add your domain
]
```

### Environment Variables
- Never commit `.env` to git
- Use `.env.example` as template
- Different configs for dev/prod
- Rotate secrets regularly

### Input Validation
```python
# Pydantic schemas validate all inputs
# SQLAlchemy ORM prevents SQL injection
# FastAPI type hints enforce contracts
```

### HTTPS/TLS
- Required for production
- Use Let's Encrypt for free certificates
- Redirect HTTP to HTTPS

---

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Lazy loading with React.lazy()
- **Image Optimization**: Responsive images, WebP format
- **Caching**: Service workers, HTTP cache headers
- **Bundling**: Vite minification, tree-shaking

### Backend Optimization
- **Database Indexing**: On country code, severity fields
- **Connection Pooling**: SQLAlchemy engine pool settings
- **API Caching**: Redis cache for global metrics (future)
- **Pagination**: Limit feed items to 50/request

### Network Optimization
- **Compression**: Gzip compression for all responses
- **CDN**: CloudFlare or similar for static assets
- **API Timeout**: 5 seconds for graceful fallback
- **Batch Requests**: Combine multiple queries when possible

---

## 🧪 Testing Strategy

### Backend Testing
```python
# pytest tests/
def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200

def test_fusion_algorithm():
    score = calculate_fusion_score(90, 80, 50, 95, 75, 85)
    assert 0 <= score <= 100
```

### Frontend Testing
```typescript
// vitest tests/
describe('Dashboard', () => {
  it('displays metric cards', () => {
    render(<Dashboard />)
    expect(screen.getByText('Active Alerts')).toBeInTheDocument()
  })
})
```

### Integration Testing
```bash
# E2E with Playwright
npm run test:e2e
```

---

## 📊 Seeded Data Details

### 60 Countries Across Risk Spectrum

**Critical (75-100):** 5 countries
- Somalia, Yemen, South Sudan, Afghanistan, Sudan

**High (50-74):** 15 countries
- Syria, Nigeria, Myanmar, DRC, Pakistan, Iraq, Chad, CAR, Eritrea, etc.

**Elevated (25-49):** 20 countries
- India, Bangladesh, Indonesia, Mexico, Philippines, Kenya, etc.

**Low (0-24):** 20 countries
- Canada, Australia, Germany, Japan, Scandinavia, etc.

### Auto-Generated Content
- **201 Alerts**: Triggered by risk scores ≥ 55
- **259 Feed Items**: Generated from risk scores ≥ 45
- **Global Metrics**: Updated daily/weekly with data

---

## 🔄 Development Workflow

### Local Development
```bash
./setup.sh                          # One-time setup
npm run dev                         # Frontend (Port 8080)
cd backend && python -m uvicorn app.main:app --reload --port 8000  # Backend
```

### Git Workflow
```bash
# Feature branch
git checkout -b feature/new-risk-vector

# Make changes, test locally
npm run test && python -m pytest

# Commit
git add .
git commit -m "Add new risk vector"

# Push and create PR
git push origin feature/new-risk-vector
```

### Code Standards
- Python: PEP 8, type hints required
- TypeScript: Strict mode, no `any` types
- Components: Functional, hooks-based
- Comments: JSDoc for public APIs

---

## 🚀 Future Roadmap

### Phase 2 (Q2 2026)
- [ ] Real-time data integration (news APIs)
- [ ] WebSocket support for live updates
- [ ] Multi-language support
- [ ] Advanced filtering & search

### Phase 3 (Q3 2026)
- [ ] Machine learning predictions
- [ ] Anomaly detection
- [ ] Custom alerts configuration
- [ ] Data export (CSV, PDF)

### Phase 4 (Q4 2026)
- [ ] Mobile app (React Native)
- [ ] Blockchain audit trail
- [ ] API key authentication
- [ ] Analytics dashboard

---

## 📚 Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **React Docs**: https://react.dev
- **SQLAlchemy Docs**: https://www.sqlalchemy.org
- **Pydantic Docs**: https://docs.pydantic.dev
- **Vite Guide**: https://vitejs.dev
- **shadcn/ui**: https://shadcn-ui.com

---

## 📞 Support & Contact

- **GitHub Issues**: Report bugs
- **GitHub Discussions**: Ask questions
- **Email**: reyanshpatel@example.com
- **Documentation**: See README.md for deployment

---

**Last Updated**: April 11, 2026  
**Document Version**: 1.0  
**Application Version**: 1.0.0
