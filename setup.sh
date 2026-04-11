#!/bin/bash

# FusionScope - Complete Development Environment Setup
# Run this script to set up and start both backend and frontend

set -e

echo "🌍 FusionScope - Development Environment Setup"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Setup
echo -e "${BLUE}Setting up Backend...${NC}"

cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

if [ ! -f "fusionscope.db" ]; then
    echo "Seeding database..."
    python -m scripts.seed
else
    echo "Database already seeded ✓"
fi

cd ..

# Frontend Setup
echo -e "${BLUE}Setting up Frontend...${NC}"

if [ ! -f ".env.local" ]; then
    echo "Creating frontend environment file..."
    cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
EOF
    echo "✓ Created .env.local with API configuration"
fi

# Display instructions
echo -e "${GREEN}Setup Complete!${NC}"
echo ""
echo "To start the development environment:"
echo ""
echo -e "${YELLOW}Terminal 1 - Backend:${NC}"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python -m uvicorn app.main:app --reload --port 8000"
echo ""
echo -e "${YELLOW}Terminal 2 - Frontend:${NC}"
echo "  npm run dev  # or 'bun run dev'"
echo ""
echo -e "${YELLOW}Then open in browser:${NC}"
echo "  Frontend: http://localhost:8080"
echo "  Backend API: http://localhost:8000"
echo "  Backend Docs: http://localhost:8000/docs"
echo ""
echo -e "${GREEN}✓ Both systems ready to run!${NC}"
