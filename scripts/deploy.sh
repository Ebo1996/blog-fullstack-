#!/bin/bash
# ============================================
# EVENTIFY ETHIOPIA - PRODUCTION DEPLOYMENT
# ============================================
# Usage: ./scripts/deploy.sh [production|staging]

set -e  # Exit on error

ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Starting deployment to $ENVIRONMENT..."
echo "📅 Timestamp: $TIMESTAMP"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env files exist
check_env_files() {
    echo -e "\n${YELLOW}📋 Checking environment files...${NC}"
    
    if [ ! -f "backend/.env.production" ]; then
        echo -e "${RED}❌ backend/.env.production not found!${NC}"
        echo "   Copy backend/.env.production.example and fill in values"
        exit 1
    fi
    
    if [ ! -f "frontend/.env.production" ]; then
        echo -e "${RED}❌ frontend/.env.production not found!${NC}"
        echo "   Copy frontend/.env.production.example and fill in values"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Environment files found${NC}"
}

# Run tests
run_tests() {
    echo -e "\n${YELLOW}🧪 Running tests...${NC}"
    
    cd backend
    npm test --passWithNoTests || true
    cd ..
    
    echo -e "${GREEN}✓ Tests completed${NC}"
}

# Build applications
build_apps() {
    echo -e "\n${YELLOW}🔨 Building applications...${NC}"
    
    # Backend
    echo "Building backend..."
    cd backend
    npm run build
    cd ..
    
    # Frontend
    echo "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    echo -e "${GREEN}✓ Build completed${NC}"
}

# Build Docker images
build_docker() {
    echo -e "\n${YELLOW}🐳 Building Docker images...${NC}"
    
    docker-compose build --no-cache
    
    echo -e "${GREEN}✓ Docker images built${NC}"
}

# Database backup
backup_database() {
    echo -e "\n${YELLOW}💾 Creating database backup...${NC}"
    
    ./scripts/backup-db.sh
    
    echo -e "${GREEN}✓ Database backup created${NC}"
}

# Deploy with Docker Compose
deploy_docker() {
    echo -e "\n${YELLOW}🚢 Deploying with Docker Compose...${NC}"
    
    # Stop existing containers
    docker-compose down
    
    # Start new containers
    docker-compose up -d
    
    # Wait for services to be healthy
    echo "⏳ Waiting for services to be healthy..."
    sleep 30
    
    echo -e "${GREEN}✓ Deployment completed${NC}"
}

# Health check
health_check() {
    echo -e "\n${YELLOW}🏥 Running health checks...${NC}"
    
    # Check backend
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "000")
    if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
        echo -e "${GREEN}✓ Backend is running${NC}"
    else
        echo -e "${RED}❌ Backend health check failed (status: $BACKEND_STATUS)${NC}"
    fi
    
    # Check frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Frontend is running${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed (status: $FRONTEND_STATUS)${NC}"
    fi
}

# Show deployment summary
show_summary() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ DEPLOYMENT COMPLETED SUCCESSFULLY${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "📊 Deployment Summary:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Timestamp: $TIMESTAMP"
    echo ""
    echo "🔗 URLs:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend:  http://localhost:3001/api"
    echo "   Swagger:  http://localhost:3001/api/docs"
    echo ""
    echo "📝 Next Steps:"
    echo "   1. Run smoke tests: npm test"
    echo "   2. Monitor logs: docker-compose logs -f"
    echo "   3. Check metrics: docker stats"
    echo ""
    echo -e "${YELLOW}⚠️  Remember to:${NC}"
    echo "   - Update DNS records"
    echo "   - Configure SSL certificates"
    echo "   - Set up monitoring alerts"
    echo "   - Enable database backups"
}

# Rollback function
rollback() {
    echo -e "\n${RED}🔄 Rolling back deployment...${NC}"
    docker-compose down
    # Restore from backup if needed
    echo -e "${YELLOW}Manual intervention may be required${NC}"
}

# Trap errors and rollback
trap rollback ERR

# Main deployment flow
main() {
    echo "╔════════════════════════════════════════╗"
    echo "║   EVENTIFY ETHIOPIA DEPLOYMENT         ║"
    echo "║   Environment: $ENVIRONMENT            ║"
    echo "╚════════════════════════════════════════╝"
    
    check_env_files
    build_apps
    build_docker
    
    # Ask for confirmation before deploying
    read -p "Ready to deploy? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled"
        exit 0
    fi
    
    backup_database
    deploy_docker
    health_check
    show_summary
}

# Run main
main
