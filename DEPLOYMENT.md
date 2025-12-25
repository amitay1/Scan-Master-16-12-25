# Deployment Guide - Scan Master Inspection Pro

## Overview

This guide covers deploying Scan Master Inspection Pro in three different scenarios:
1. **Multi-tenant SaaS** (70% of market) - Cloud deployment with Replit
2. **PWA with Offline** (20% of market) - Progressive Web App deployment
3. **Air-gapped Environments** (10% of market) - Standalone deployment with export/import

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Deployment Options](#deployment-options)
  - [Option 1: Replit Auto-scale Deployment](#option-1-replit-auto-scale-deployment)
  - [Option 2: Reserved VM Deployment](#option-2-reserved-vm-deployment)
  - [Option 3: Desktop Application](#option-3-desktop-application)
- [Security Configuration](#security-configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [Backup & Recovery](#backup--recovery)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database (Neon or similar)
- Supabase account for authentication
- Domain name (for production)
- SSL certificate (for production)

## Environment Configuration

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure essential variables:**
   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require

   # Supabase Auth (Required)
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key

   # Organization Settings
   DEFAULT_ORG_ID=generate-a-uuid-here
   REQUIRE_ORG_MEMBERSHIP=true

   # Security (Generate strong keys)
   JWT_SECRET=generate-strong-secret-key
   SESSION_SECRET=generate-strong-session-key
   ```

3. **Generate secure keys:**
   ```bash
   # Generate JWT secret
   openssl rand -base64 32

   # Generate session secret
   openssl rand -base64 32
   ```

## Deployment Options

### Option 1: Replit Auto-scale Deployment (Recommended)

Best for: Web applications with variable traffic

1. **Click the "Publish" button** in your Replit workspace

2. **Select "Autoscale"** deployment type

3. **Configure deployment settings:**
   - Machine Power: 0.5 vCPU (minimum)
   - Max machines: 3 (adjust based on expected traffic)
   - Min machines: 1
   - Scale-down delay: 5 minutes

4. **Set environment variables** in the deployment configuration

5. **Click "Publish"** to deploy

**Advantages:**
- Automatic scaling based on traffic
- Cost-effective for variable loads
- Built-in SSL and domain management
- Zero-downtime deployments

### Option 2: Reserved VM Deployment

Best for: Consistent traffic or stateful applications

1. **Click "Publish"** → Select **"Reserved VM"**

2. **Choose VM specifications:**
   - 1 vCPU, 2GB RAM (minimum)
   - 2 vCPU, 4GB RAM (recommended)

3. **Configure persistent storage** if needed

4. **Deploy and monitor** via the Publishing tab

**Advantages:**
- Consistent performance
- No cold starts
- Better for WebSocket connections
- Predictable costs

### Option 3: Desktop Application

For air-gapped or offline environments:

1. **Build the Electron app:**
   ```bash
   npm run build
   npm run electron:build
   ```

2. **Distribute the installer:**
   - Windows: `dist/Scan Master Setup.exe`
   - macOS: `dist/Scan Master.dmg`
   - Linux: `dist/scan-master.AppImage`

3. **Configure for offline mode:**
   - Pre-load standards data
   - Enable local storage
   - Configure export/import paths

## Security Configuration

### 1. Enable HTTPS (Production)

Replit handles SSL automatically. For other deployments:

```nginx
server {
    listen 443 ssl http2;
    server_name scanmaster.yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Configure CORS

Update allowed origins in `.env`:
```env
CORS_ORIGINS=https://app.yourdomain.com,https://yourdomain.com
```

### 3. Set Rate Limits

Configure in `.env`:
```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

### 4. Enable Security Headers

Already configured via Helmet middleware. Verify with:
```bash
curl -I https://your-app.com | grep -i security
```

## Monitoring & Health Checks

### Health Endpoints

- `/health` - Comprehensive health status
- `/health/live` - Liveness probe (is service running?)
- `/health/ready` - Readiness probe (can accept traffic?)
- `/metrics` - Prometheus-compatible metrics

### Monitoring Setup

1. **Check health status:**
   ```bash
   curl https://your-app.com/health?detailed=true
   ```

2. **Monitor metrics:**
   ```bash
   curl https://your-app.com/metrics
   ```

3. **Set up alerts** (example with UptimeRobot):
   - Monitor: `https://your-app.com/health`
   - Alert when status != 200
   - Check interval: 5 minutes

### Logging

Logs are automatically managed:
- **Development:** Console output
- **Production:** Structured JSON logs
- **Location:** `logs/` directory
- **Rotation:** Automatic after 10MB

View logs:
```bash
# Recent errors
tail -f logs/error.log

# All logs
tail -f logs/combined.log
```

## Backup & Recovery

### Automated Backups

1. **Enable in `.env`:**
   ```env
   BACKUP_ENABLED=true
   BACKUP_SCHEDULE=0 2 * * *
   BACKUP_RETENTION_DAYS=30
   ```

2. **Run manual backup:**
   ```bash
   ./scripts/backup.sh
   ```

3. **Configure cloud backup (optional):**
   ```env
   S3_BUCKET=your-backup-bucket
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   ```

### Recovery Process

1. **List available backups:**
   ```bash
   ./scripts/restore.sh
   ```

2. **Restore from backup:**
   ```bash
   ./scripts/restore.sh backups/backup_20240104_120000.sql.gz
   ```

3. **Verify restoration:**
   ```bash
   npm run health:check
   ```

## Performance Optimization

### 1. Enable Production Mode
```env
NODE_ENV=production
```

### 2. Enable Compression
Already configured via compression middleware

### 3. Configure Caching
```env
CACHE_TTL=3600
```

### 4. Optimize Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_sheets_org_user ON technique_sheets(org_id, user_id);
CREATE INDEX idx_sheets_created ON technique_sheets(created_at DESC);
```

## Troubleshooting

### Common Issues

#### 1. "Organization ID required" error
**Solution:** Ensure all API calls include the `x-org-id` header

#### 2. Database connection errors
**Solution:** 
- Verify `DATABASE_URL` is correct
- Check SSL mode settings
- Ensure database is accessible

#### 3. High memory usage
**Solution:**
- Increase VM resources
- Enable swap space
- Optimize queries

#### 4. Slow response times
**Solution:**
- Check `/metrics` endpoint
- Review slow query logs
- Enable caching

### Debug Mode

Enable detailed logging:
```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Support Resources

- **Documentation:** `/docs` directory
- **Health Status:** `/health?detailed=true`
- **Metrics:** `/metrics`
- **Logs:** `logs/` directory

## Post-Deployment Checklist

- [ ] Verify all health checks pass
- [ ] Test authentication flow
- [ ] Verify multi-tenant isolation
- [ ] Configure automated backups
- [ ] Set up monitoring alerts
- [ ] Test offline functionality (PWA)
- [ ] Verify export/import works
- [ ] Document API keys and secrets
- [ ] Create user documentation
- [ ] Schedule regular security updates

## Maintenance

### Regular Tasks

**Daily:**
- Monitor health endpoints
- Check error logs

**Weekly:**
- Review metrics and performance
- Update dependencies (security patches)

**Monthly:**
- Test backup restoration
- Review security logs
- Update documentation

**Quarterly:**
- Security audit
- Performance optimization
- Dependency updates

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** to version control
2. **Rotate secrets regularly** (every 90 days)
3. **Use strong passwords** for all accounts
4. **Enable 2FA** for admin accounts
5. **Keep dependencies updated**
6. **Monitor for security advisories**

## Contact & Support

For deployment assistance or issues:
- Check the logs first: `logs/error.log`
- Review health status: `/health?detailed=true`
- Consult this documentation

---

*Last updated: November 2024*
*Version: 1.0.0*