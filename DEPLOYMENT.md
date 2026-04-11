# 🚀 FusionScope - Deployment Guide

Complete guide for deploying FusionScope to production environments.

---

## 📋 Pre-Deployment Checklist

- [ ] All code committed to git
- [ ] Environment variables configured
- [ ] Database seeded with data
- [ ] Frontend built for production
- [ ] API endpoints tested
- [ ] Dependencies listed in requirements.txt & package.json
- [ ] CORS origins configured
- [ ] Database backups scheduled

---

## 1. Local Development Verification

Before deploying, verify everything works locally:

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Test API
curl http://localhost:8000/api/health
curl http://localhost:8000/api/countries
```

All endpoints should respond with valid JSON.

---

## 2. Backend Deployment (FastAPI)

### Option A: Deploy to Heroku

```bash
# 1. Create Heroku app
heroku create fusionscope-api

# 2. Add PostgreSQL database
heroku addons:create heroku-postgresql:hobby-dev

# 3. Set environment variables
heroku config:set DEBUG=False
heroku config:set ENVIRONMENT=production

# 4. Deploy code
git push heroku main

# 5. Run migrations
heroku run python -m scripts.seed

# 6. Check logs
heroku logs --tail
```

### Option B: Deploy to Railway

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Deploy
railway up

# 5. Set environment variables
railway variables set DEBUG=False
railway variables set ENVIRONMENT=production
```

### Option C: Deploy to Render

```bash
# 1. Connect GitHub repository to Render.com

# 2. Create new Web Service, select Python

# 3. Build command:
pip install -r requirements.txt

# 4. Start command:
uvicorn app.main:app --host 0.0.0.0 --port $PORT

# 5. Set environment variables in dashboard
```

### Option D: Deploy to AWS EC2

```bash
# 1. SSH into instance
ssh -i key.pem ec2-user@your-instance.com

# 2. Install dependencies
sudo yum install python3 python3-pip git

# 3. Clone repository
git clone https://github.com/reyanshbharatkpatel-beep/fusionscope.git
cd fusionscope/backend

# 4. Setup environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 5. Run with systemd
sudo nano /etc/systemd/system/fusionscope.service
```

Service file content:
```ini
[Unit]
Description=FusionScope API
After=network.target

[Service]
Type=notify
User=ec2-user
WorkingDirectory=/home/ec2-user/fusionscope/backend
Environment="PATH=/home/ec2-user/fusionscope/backend/venv/bin"
ExecStart=/home/ec2-user/fusionscope/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl start fusionscope
sudo systemctl enable fusionscope
```

---

## 3. Frontend Deployment (React)

### Option A: Deploy to Vercel

```bash
# 1. Connect GitHub to Vercel dashboard

# 2. Configure build settings:
Build Command: npm run build
Output Directory: dist
Environment Variable: VITE_API_BASE_URL=https://api.fusionscope.com

# 3. Deploy automatically on push
```

### Option B: Deploy to Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Deploy
netlify deploy --prod

# 4. Set environment variables
netlify env:set VITE_API_BASE_URL https://api.fusionscope.com
```

### Option C: Deploy to GitHub Pages

```bash
# 1. Update vite.config.ts
export default {
  base: '/fusionscope/',
  // ... rest of config
}

# 2. Build
npm run build

# 3. Deploy to gh-pages
npm run deploy
```

### Option D: Deploy to AWS S3 + CloudFront

```bash
# 1. Build website
npm run build

# 2. Sync to S3
aws s3 sync dist/ s3://fusionscope-bucket/

# 3. Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E1234567890ABC --paths "/*"
```

---

## 4. Database Setup (Production)

### PostgreSQL Configuration

```bash
# 1. Create database
createdb fusionscope

# 2. Update .env
DATABASE_URL=postgresql://user:password@localhost:5432/fusionscope

# 3. Seed data
python -m scripts.seed
```

### Environment Variables

Create a `.env.production` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/fusionscope

# Application
DEBUG=False
ENVIRONMENT=production
LOG_LEVEL=INFO

# CORS
CORS_ORIGINS=["https://fusionscope.com", "https://app.fusionscope.com"]

# Security
ALLOWED_HOSTS=["fusionscope.com", "api.fusionscope.com"]
```

---

## 5. SSL/TLS Certificate Setup

### Using Let's Encrypt with Certbot

```bash
# 1. Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# 2. Generate certificate
sudo certbot certonly --standalone -d api.fusionscope.com

# 3. Configure Nginx
sudo nano /etc/nginx/sites-available/fusionscope
```

Nginx config:
```nginx
server {
    listen 443 ssl http2;
    server_name api.fusionscope.com;

    ssl_certificate /etc/letsencrypt/live/api.fusionscope.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.fusionscope.com/privkey.pem;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

server {
    listen 80;
    server_name api.fusionscope.com;
    return 301 https://$server_name$request_uri;
}
```

---

## 6. Docker Deployment

### Build Docker Images

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/fusionscope
    depends_on:
      - db

  frontend:
    build: ./
    ports:
      - "8080:80"
    environment:
      VITE_API_BASE_URL: http://localhost:8000

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: fusionscope
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 7. Monitoring & Logging

### Application Monitoring

```bash
# Backend logs
journalctl -u fusionscope -f

# Frontend errors (browser console)
# Check CloudWatch if using AWS
```

### Health Checks

```bash
# Periodic health check
curl -f http://localhost:8000/api/health || systemctl restart fusionscope
```

### Performance Monitoring

- **Backend**: Add logging to routes.py
- **Frontend**: Use Sentry for error tracking
- **Database**: Monitor slow queries

---

## 8. Scaling Configuration

### Horizontal Scaling (Load Balancer)

```nginx
upstream backend {
    server backend1:8000;
    server backend2:8000;
    server backend3:8000;
}

server {
    listen 80;
    location / {
        proxy_pass http://backend;
    }
}
```

### Caching Strategy

```python
# Add to app/main.py
from fastapi_cache2 import FastAPICache2
from fastapi_cache2.backends.redis import RedisBackend

FastAPICache2.init(RedisBackend(url="redis://localhost:6379"), prefix="fastapi-cache")
```

---

## 9. Backup & Recovery

### Database Backups

```bash
# PostgreSQL dump
pg_dump fusionscope > backup_$(date +%Y%m%d).sql

# Restore
psql fusionscope < backup_20260411.sql

# Automated daily backups (cron)
0 2 * * * pg_dump fusionscope | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## 10. Post-Deployment Verification

```bash
# 1. Test API health
curl https://api.fusionscope.com/api/health

# 2. Test frontend loading
curl -I https://fusionscope.com

# 3. Check CORS headers
curl -H "Origin: https://fusionscope.com" https://api.fusionscope.com/api/countries

# 4. Verify database
psql fusionscope -c "SELECT COUNT(*) FROM country;"

# 5. Monitor logs
tail -f /var/log/fusionscope/app.log
```

---

## 11. Troubleshooting Deployment

| Issue | Solution |
|-------|----------|
| **502 Bad Gateway** | Check backend service is running: `systemctl status fusionscope` |
| **CORS errors** | Verify CORS_ORIGINS includes client domain |
| **Database connection failed** | Check DATABASE_URL format and network connectivity |
| **Out of memory** | Increase server resources or optimize queries |
| **Slow response times** | Enable caching, add indexes, check database |
| **SSL certificate error** | Renew certificate: `certbot renew` |

---

## 12. Rollback Procedure

```bash
# Rollback to previous deployment
git revert HEAD
git push heroku main

# Or restore from backup
git tag
git checkout v1.0.0
git push heroku v1.0.0:main
```

---

## 🎯 Production Checklist

- [ ] Environment variables set correctly
- [ ] Database backed up
- [ ] SSL/TLS certificate installed
- [ ] CORS configured for production domains
- [ ] Error logging enabled
- [ ] Performance monitoring active
- [ ] Backup schedules configured
- [ ] Team notified of deployment
- [ ] Smoke tests passed
- [ ] Monitored for 24 hours post-deployment

---

**Deployment Date**: April 11, 2026  
**Version**: 1.0.0  
**Status**: Ready for Production
