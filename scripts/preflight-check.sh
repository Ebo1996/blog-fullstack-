#!/bin/bash
# ============================================
# PRE-FLIGHT DEPLOYMENT CHECKS
# ============================================
# Validates system is ready for deployment

set -e

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   PRE-FLIGHT DEPLOYMENT CHECKS         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

FAILED=0

# Check function
check() {
    local name=$1
    local command=$2
    
    echo -n "Checking $name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Check Node.js
echo -e "${YELLOW}📦 System Dependencies${NC}"
check "Node.js" "node --version"
check "npm" "npm --version"
check "Docker" "docker --version"
check "Docker Compose" "docker-compose --version"
check "MongoDB client" "mongosh --version || mongo --version"

echo ""

# Check environment files
echo -e "${YELLOW}🔐 Environment Configuration${NC}"
check "Backend .env.production" "test -f backend/.env.production"
check "Frontend .env.production" "test -f frontend/.env.production"

echo ""

# Check critical environment variables
echo -e "${YELLOW}⚙️  Environment Variables${NC}"

if [ -f "backend/.env.production" ]; then
    source backend/.env.production
    
    [ ! -z "$MONGODB_URI" ] && echo -e "MongoDB URI: ${GREEN}✓${NC}" || { echo -e "MongoDB URI: ${RED}✗${NC}"; FAILED=$((FAILED + 1)); }
    [ ! -z "$JWT_SECRET" ] && echo -e "JWT Secret: ${GREEN}✓${NC}" || { echo -e "JWT Secret: ${RED}✗${NC}"; FAILED=$((FAILED + 1)); }
    [ ! -z "$CLOUDINARY_CLOUD_NAME" ] && echo -e "Cloudinary: ${GREEN}✓${NC}" || { echo -e "Cloudinary: ${RED}✗${NC}"; FAILED=$((FAILED + 1)); }
    [ ! -z "$CHAPA_SECRET_KEY" ] && echo -e "Chapa Key: ${GREEN}✓${NC}" || { echo -e "Chapa Key: ${RED}✗${NC}"; FAILED=$((FAILED + 1)); }
    
    # Check for test keys in production
    if [[ "$CHAPA_SECRET_KEY" == *"TEST"* ]]; then
        echo -e "${RED}⚠️  WARNING: Using Chapa TEST key!${NC}"
        FAILED=$((FAILED + 1))
    fi
fi

echo ""

# Check build status
echo -e "${YELLOW}🔨 Build Status${NC}"

echo -n "Backend build... "
if cd backend && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    cd ..
else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
    cd ..
fi

echo -n "Frontend build... "
if cd frontend && npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    cd ..
else
    echo -e "${RED}✗${NC}"
    FAILED=$((FAILED + 1))
    cd ..
fi

echo ""

# Check disk space
echo -e "${YELLOW}💾 System Resources${NC}"

AVAILABLE_SPACE=$(df -h . | awk 'NR==2 {print $4}')
echo "Available disk space: $AVAILABLE_SPACE"

FREE_MEM=$(free -h | awk 'NR==2 {print $7}')
echo "Available memory: $FREE_MEM"

echo ""

# Check network connectivity
echo -e "${YELLOW}🌐 Network Connectivity${NC}"
check "Internet connection" "ping -c 1 google.com"
check "MongoDB Atlas (if using)" "ping -c 1 cloud.mongodb.com"

echo ""

# Summary
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║   ✅ ALL CHECKS PASSED                 ║${NC}"
    echo -e "${GREEN}║   Ready for deployment!                ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔════════════════════════════════════════╗${NC}"
    echo -e "${RED}║   ❌ $FAILED CHECK(S) FAILED                ║${NC}"
    echo -e "${RED}║   Fix issues before deployment         ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════╝${NC}"
    exit 1
fi
