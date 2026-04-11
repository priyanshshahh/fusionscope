Understood. I have scrubbed all "localhost" references and updated the documentation to reflect a purely **cloud-first/production** environment, focusing on your Vercel deployment and remote API architecture.

***

# 🌍 FusionScope - Global Crisis Fusion Dashboard

A production-ready full-stack application providing real-time global crisis monitoring, risk analysis, and geopolitical intelligence through an advanced fusion algorithm.

**Live Demo:** [https://fusionscope.vercel.app/](https://fusionscope.vercel.app/)  

---

## ✨ Key Features

### 🎯 Global Crisis Monitoring
- **Real-time Dashboard**: Monitor 60+ countries with live risk metrics.
- **Fusion Algorithm**: Proprietary scoring system combining 6 risk vectors.
- **Risk Vectors**: Water stress, drought, flood, food insecurity, migration pressure, and infrastructure disruption.
- **Severity Classification**: Low, Elevated, High, and Critical severity bands.

### 📊 Rich Analytics
- **Global Metrics**: Active alerts, critical countries count, and average fusion scores.
- **Country Profiles**: Detailed risk breakdown for each specific country.
- **Crisis Feeds**: Curated feed of 259+ crisis events.
- **Alert System**: 201+ auto-generated alerts sorted by severity.

### 🔗 Seamless Integration
- **Cloud-Native Architecture**: Fully optimized for Vercel and remote API environments.
- **Type-Safe**: TypeScript frontend + Pydantic schema validation.
- **Production Ready**: CORS configured, error handling, and graceful degradation with automatic mock data fallback.

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────┐
│             Vercel Hosted Frontend                  │
│  - Dashboard, Country Detail, Alerts, Feed Pages    │
│  - API Client with intelligent fallback              │
└──────────────────┬──────────────────────────────────┘
                   │
                   │ Production API HTTPS
                   │
┌──────────────────▼──────────────────────────────────┐
│             FastAPI Production Backend              │
│  - 7 REST Endpoints                                 │
│  - SQLAlchemy ORM                                   │
│  - Business Logic Services                          │
└──────────────────┬──────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────────┐
│            Cloud Database (PostgreSQL)              │
│  - 60 Global Countries                              │
│  - 201+ Auto-generated Alerts                       │
│  - 259+ Crisis Feed Items                           │
│  - Real-time Global Metrics                         │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Deployment & Environment

### Frontend Configuration
The frontend is deployed on **Vercel**. To point to the production API, ensure your environment variables are set in the Vercel dashboard:

```bash
# .env.production
VITE_API_BASE_URL=https://api.fusionscope.app
```

### Backend Deployment
The FastAPI backend is designed to run in a containerized environment (Docker) or via cloud providers like Render/Railway.

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Initialize Production Database**
   ```bash
   python -m scripts.seed
   ```

---

## 📦 API Endpoints (Production)

### Health Check
`GET /api/health` → `{"status":"healthy","service":"FusionScope Backend"}`

### Global Metrics
`GET /api/global-metrics` → Returns active alerts, critical counts, and average fusion scores across all tracked regions.

### Country Detail
`GET /api/country/{code}` → Fetches high-resolution risk data for specific ISO codes (e.g., `SOM`, `YEM`, `AFG`).

---

## 🧮 Fusion Algorithm

The proprietary fusion score combines 6 risk dimensions with weighted importance to determine humanitarian priority:

$$Fusion Score = (0.25 \times Water) + (0.20 \times Drought) + (0.20 \times Flood) + (0.15 \times Food) + (0.10 \times Migration) + (0.10 \times Infra)$$

**Severity Classification:**
- **Low**: 0-24
- **Elevated**: 25-49
- **High**: 50-74
- **Critical**: 75-100

---

## 🎨 Technology Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS, shadcn/ui |
| **Backend** | FastAPI, Python, SQLAlchemy, Pydantic |
| **Database** | PostgreSQL / SQLite |
| **Infrastructure**| Vercel, GitHub Actions (CI/CD) |

---

## 👥 Contributors

* **Priyansh Shah** — [@priyanshshahh](https://github.com/priyanshshahh)
* **Vimarsh Khattar** — [@vimarshkhattar](https://github.com/vimarshkhattar)
* **Reyansh Bharat Patel** — [@reyanshbharatkpatel-beep](https://github.com/reyanshbharatkpatel-beep)

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Last Updated**: April 2026  
**Status**: ✅ Production Ready | 🚀 Deployed | 📊 Live Data | 🎯 Mission Critical
