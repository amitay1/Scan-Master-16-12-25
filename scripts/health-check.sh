#!/bin/bash

# Health Check Script
# This script performs comprehensive health checks on the application

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:5000}"
TIMEOUT="${TIMEOUT:-5}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Checking ${description}... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${BASE_URL}${endpoint}" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (${response})"
        return 0
    else
        echo -e "${RED}✗${NC} (${response})"
        return 1
    fi
}

# Function to check detailed health
check_detailed_health() {
    echo "Fetching detailed health status..."
    
    response=$(curl -s --max-time ${TIMEOUT} "${BASE_URL}/health?detailed=true" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
    else
        echo -e "${RED}Failed to fetch detailed health status${NC}"
    fi
}

echo "======================================"
echo "Application Health Check"
echo "Target: ${BASE_URL}"
echo "======================================"
echo ""

# Check basic endpoints
failures=0

check_endpoint "/health/live" "200" "Liveness probe" || ((failures++))
check_endpoint "/health/ready" "200" "Readiness probe" || ((failures++))
check_endpoint "/health" "200" "Overall health" || ((failures++))
check_endpoint "/api/health" "200" "API health" || ((failures++))

echo ""
echo "======================================"

# Show detailed health if basic health check passed
if [ $failures -eq 0 ]; then
    echo ""
    check_detailed_health
    echo ""
    echo -e "${GREEN}All health checks passed!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}${failures} health check(s) failed${NC}"
    echo ""
    echo "Attempting to fetch logs..."
    
    # Try to fetch recent error logs
    if command -v docker &> /dev/null; then
        echo "Recent container logs:"
        docker logs --tail 20 $(docker ps -q -f "ancestor=scan-master") 2>/dev/null || echo "No Docker logs available"
    fi
    
    if [ -f "logs/error.log" ]; then
        echo ""
        echo "Recent error logs:"
        tail -20 logs/error.log
    fi
    
    exit 1
fi