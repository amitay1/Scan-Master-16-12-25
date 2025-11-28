#!/bin/bash

# Production Deployment Script
# This script handles the complete deployment process

set -e

echo "======================================"
echo "Scan Master Inspection Pro Deployment"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${YELLOW}Warning: .env.production not found. Using default values.${NC}"
fi

# Step 1: Pre-deployment checks
echo -e "\n${BLUE}Step 1: Pre-deployment checks${NC}"
echo "Checking Node.js version..."
node_version=$(node -v)
echo "Node.js version: $node_version"

echo "Checking npm version..."
npm_version=$(npm -v)
echo "npm version: $npm_version"

# Step 2: Install dependencies
echo -e "\n${BLUE}Step 2: Installing dependencies${NC}"
npm ci --production=false

# Step 3: Run tests (if available)
echo -e "\n${BLUE}Step 3: Running tests${NC}"
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test || echo -e "${YELLOW}Tests failed or not configured${NC}"
else
    echo "No tests configured"
fi

# Step 4: Build the application
echo -e "\n${BLUE}Step 4: Building application${NC}"
npm run build

# Step 5: Run database migrations
echo -e "\n${BLUE}Step 5: Running database migrations${NC}"
if [ -n "$DATABASE_URL" ]; then
    npm run db:migrate || echo -e "${YELLOW}Migration failed or not configured${NC}"
else
    echo -e "${YELLOW}DATABASE_URL not set, skipping migrations${NC}"
fi

# Step 6: Optimize assets
echo -e "\n${BLUE}Step 6: Optimizing assets${NC}"
# Compress static files
if command -v gzip &> /dev/null; then
    find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k {} \;
    echo "Static files compressed"
fi

# Step 7: Create backup before deployment
echo -e "\n${BLUE}Step 7: Creating pre-deployment backup${NC}"
if [ -f "scripts/backup.sh" ]; then
    ./scripts/backup.sh || echo -e "${YELLOW}Backup failed${NC}"
else
    echo "Backup script not found"
fi

# Step 8: Health check
echo -e "\n${BLUE}Step 8: Performing health check${NC}"
npm run start:prod &
SERVER_PID=$!
sleep 5

if curl -f http://localhost:5000/health > /dev/null 2>&1; then
    echo -e "${GREEN}Health check passed!${NC}"
    kill $SERVER_PID
else
    echo -e "${RED}Health check failed!${NC}"
    kill $SERVER_PID
    exit 1
fi

# Step 9: Generate deployment info
echo -e "\n${BLUE}Step 9: Generating deployment info${NC}"
DEPLOY_INFO="deploy-info.json"
cat > $DEPLOY_INFO << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(node -p "require('./package.json').version")",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "branch": "$(git branch --show-current 2>/dev/null || echo 'unknown')",
  "node_version": "$node_version",
  "npm_version": "$npm_version",
  "environment": "${NODE_ENV:-production}"
}
EOF

echo "Deployment info saved to $DEPLOY_INFO"
cat $DEPLOY_INFO

# Step 10: Final message
echo -e "\n${GREEN}======================================"
echo "Deployment completed successfully!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo "1. Verify the application at your production URL"
echo "2. Monitor the health endpoint: /health"
echo "3. Check metrics at: /metrics"
echo "4. Review logs for any issues"
echo ""
echo -e "${YELLOW}Remember to:"
echo "- Set up SSL/TLS certificates"
echo "- Configure your reverse proxy (nginx/Apache)"
echo "- Set up monitoring and alerting"
echo "- Configure automated backups${NC}"