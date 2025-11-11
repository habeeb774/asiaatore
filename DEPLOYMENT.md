## Monorepo layout

This project can be used as a simple root app or as a two-package workspace:

my-store/
├─ client/   ← React app (Vite)
├─ server/   ← Express backend (Node ESM)
├─ prisma/   ← schema/migrations
├─ .env

To migrate existing frontend files into `client/`, a helper script exists:

- Run migration (one-time):
	- `node scripts/migrate-to-client.mjs`
- Then install and run:
	- `npm install`
	- `npm run dev:all` (starts client and server in parallel)

Vite dev proxy still targets `/api` → backend; adjust `client/vite.config.js` if needed.

# Advanced E-Commerce Platform - Deployment Guide

This guide helps you launch the advanced e-commerce platform with cutting-edge features including NFT loyalty, AI personalization, AR viewing, voice commerce, and more.

## 🚀 Features Overview

### Core Platform
- Multi-language e-commerce (Arabic/English/French)
- PWA with offline capabilities
- Advanced admin dashboard with analytics
- Real-time order tracking and delivery management

### Advanced Features
- **NFT Loyalty Program**: Blockchain-based rewards system
- **AR Product Viewer**: WebXR-powered virtual try-on
- **Voice Commerce**: AI-powered voice shopping
- **Smart Inventory AI**: ML-driven stock optimization
- **Dynamic Personalization**: AI product recommendations
- **Gamification**: Points, badges, and challenges
- **Social Commerce**: Community-driven shopping
- **Sustainability Dashboard**: Eco-impact tracking

## Prerequisites
- Node.js 18+
- MySQL 8.0+ or PostgreSQL
- Redis (for caching and sessions)
- Reverse proxy (Nginx/Traefik/Caddy) with HTTPS
- Domain(s) for site and API
- **For Advanced Features:**
  - Blockchain node/RPC endpoint (for NFT features)
  - AI/ML service API keys (OpenAI, etc.)
  - WebXR-compatible hosting
  - Voice recognition API access

## 1) Environment Variables Setup

### Core Application
```env
# Database
DATABASE_URL="mysql://user:pass@host:port/db"
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-super-secure-jwt-secret"
BCRYPT_ROUNDS=12

# Server
PORT=4000
NODE_ENV=production
CORS_ORIGIN="https://yourdomain.com"
TRUST_PROXY=true
FORCE_HTTPS=true

# App Configuration
APP_BASE_URL="https://yourdomain.com"
SERVE_CLIENT=true
```

### Advanced Features Configuration

#### NFT & Blockchain
```env
# Blockchain Configuration
BLOCKCHAIN_RPC_URL="https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
BLOCKCHAIN_PRIVATE_KEY="your-private-key-for-minting"
NFT_CONTRACT_ADDRESS="0x..."
BLOCKCHAIN_NETWORK="ethereum"

# NFT Storage (IPFS/Arweave)
IPFS_API_KEY="your-ipfs-key"
IPFS_SECRET="your-ipfs-secret"
NFT_STORAGE_API="https://api.nft.storage"
```

#### AI & ML Services
```env
# OpenAI for voice and personalization
OPENAI_API_KEY="sk-..."
OPENAI_MODEL="gpt-4"

# Voice Recognition
SPEECH_API_KEY="your-speech-api-key"
VOICE_LANGUAGE_MODELS="ar,en,fr"

# Recommendation Engine
RECOMMENDATION_API_URL="https://your-ml-service.com"
RECOMMENDATION_API_KEY="your-ml-api-key"
```

#### AR & 3D Features
```env
# AR Configuration
AR_API_KEY="your-ar-service-key"
MODEL_STORAGE_URL="https://your-3d-models.com"
WEBXR_SUPPORTED=true
```

#### External Services
```env
# Payment Gateways
PAYPAL_CLIENT_ID="your-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-paypal-secret"
STC_PAY_API_KEY="your-stc-key"

# Analytics
GA_ID="G-XXXXXXXXXX"
MIXPANEL_TOKEN="your-mixpanel-token"

# Email/SMS
SMTP_HOST="smtp.gmail.com"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMS_API_KEY="your-sms-service-key"
```

## 2) Database Setup & Migration

### Database Initialization
```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
npm run db:seed
```

### Advanced Features Database Setup
```bash
# Create NFT-related tables
npx prisma migrate deploy --name add-nft-features

# Create AI personalization tables
npx prisma migrate deploy --name add-ai-personalization

# Create gamification tables
npx prisma migrate deploy --name add-gamification

# Seed advanced features data
node scripts/seed-advanced-features.js
```

## 3) Build & Optimization

### Frontend Build with Advanced Features
```bash
# Install client dependencies
cd client && npm ci

# Build optimized production bundle
npm run build

# The build includes:
# - Code splitting by feature (NFT, AR, Voice, etc.)
# - Lazy loading for advanced components
# - PWA service worker
# - Compressed assets with Brotli/Gzip
# - Multi-language chunks
```

### Bundle Analysis
```bash
# Analyze bundle sizes
npx vite-bundle-analyzer dist

# Check chunk sizes (should be optimized):
# - Main bundle: ~192KB (gzipped)
# - Feature chunks: 0.75KB - 10KB each
# - Vendor chunks: Properly split
```

## 4) Server Deployment

### PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-store-server',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log'
  }]
};
```

### Start Production Server
```bash
# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs my-store-server
```

## 5) Reverse Proxy & SSL Configuration

### Nginx Configuration with Advanced Features
```nginx
# Upstream for load balancing (if using multiple instances)
upstream my_store_backend {
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # API endpoints
    location /api {
        proxy_pass http://my_store_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # API-specific timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # WebSocket support for real-time features
    location /api/events {
        proxy_pass http://my_store_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # Static files with caching
    location /assets {
        alias /var/www/my-store/dist/assets;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploaded files
    location /uploads {
        alias /var/www/my-store/uploads;
        expires 30d;
        add_header Cache-Control "public";
    }

    # SPA fallback
    location / {
        root /var/www/my-store/dist;
        try_files $uri $uri/ /index.html;

        # Cache HTML lightly
        location ~* \.html$ {
            expires 1h;
            add_header Cache-Control "public, must-revalidate, proxy-revalidate";
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}
```

## 6) Advanced Features Configuration

### NFT Blockchain Integration
```bash
# Deploy smart contracts (if needed)
npx hardhat run scripts/deploy-nft-contract.js --network mainnet

# Verify contract on Etherscan
npx hardhat verify --network mainnet CONTRACT_ADDRESS

# Update environment with deployed contract address
echo "NFT_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" >> .env
```

### AI Services Setup
```bash
# Test AI service connections
curl -X POST https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hello"}]}'

# Configure voice recognition
# Ensure microphone permissions are handled in the app
```

### AR Features Setup
```bash
# Upload 3D models to storage
aws s3 cp models/ s3://your-3d-models-bucket/ --recursive

# Configure AR service API keys
# Test WebXR compatibility
```

## 7) Monitoring & Analytics

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Install PM2 monitoring (optional)
pm2 install pm2-server-monit
```

### Performance Monitoring
```bash
# Lighthouse CI for performance
npm run lighthouse

# Bundle analyzer for ongoing optimization
npm run analyze-bundle
```

### Error Tracking
```javascript
// Add to server/index.js
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

## 8) Backup Strategy

### Database Backups
```bash
# Daily database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u$user -p$pass $db > backup_$DATE.sql
gzip backup_$DATE.sql

# Upload to cloud storage
aws s3 cp backup_$DATE.sql.gz s3://your-backup-bucket/
```

### File Backups
```bash
# Backup uploaded files
rsync -avz /var/www/my-store/uploads/ /backup/uploads/

# Backup 3D models and AR assets
aws s3 sync s3://your-3d-models-bucket/ s3://your-backup-bucket/models/
```

## 9) Security Checklist

### Advanced Security Measures
- [ ] CORS properly configured for production domains
- [ ] Rate limiting enabled for API endpoints
- [ ] JWT tokens with appropriate expiration
- [ ] Input validation and sanitization
- [ ] SQL injection protection (Prisma ORM handles this)
- [ ] XSS protection enabled
- [ ] CSRF protection for forms
- [ ] Secure headers (Helmet.js configured)

### Advanced Features Security
- [ ] Blockchain private keys encrypted and secured
- [ ] AI API keys with restricted permissions
- [ ] Voice data privacy compliance (GDPR/CCPA)
- [ ] AR session data not stored without consent
- [ ] NFT minting requires user authentication

## 10) Performance Optimization

### CDN Configuration
```nginx
# Add CDN headers for static assets
location /assets {
    add_header CDN-Cache-Control "public, max-age=31536000";
    add_header X-CDN "Cloudflare";
}
```

### Database Optimization
```sql
-- Add indexes for advanced features
CREATE INDEX idx_nft_user ON nft_loyalty(user_id);
CREATE INDEX idx_gamification_points ON gamification(points DESC);
CREATE INDEX idx_personalization_user ON personalization(user_id);
```

### Caching Strategy
```javascript
// Redis caching for AI recommendations
const cache = require('redis').createClient(process.env.REDIS_URL);

// Cache AI responses
app.use('/api/ai/recommendations', cacheMiddleware);
```

## 11) Testing Production Deployment

### Automated Testing
```bash
# Run integration tests against production
npm run test:integration -- --base-url=https://yourdomain.com

# Performance testing
npm run test:performance

# Security testing
npm run test:security
```

### Manual Testing Checklist
- [ ] Homepage loads in <2 seconds
- [ ] Product search works
- [ ] User registration/login flows
- [ ] AR viewer loads on compatible devices
- [ ] Voice commerce functions
- [ ] NFT loyalty features accessible
- [ ] Admin dashboard loads
- [ ] Payment processing works
- [ ] Multi-language switching
- [ ] PWA installation prompt
- [ ] Offline functionality

## 12) Scaling Considerations

### Horizontal Scaling
```bash
# Add more PM2 instances
pm2 scale my-store-server 4

# Load balancer configuration
upstream backend {
    server 127.0.0.1:4000;
    server 127.0.0.1:4001;
    server 127.0.0.1:4002;
    server 127.0.0.1:4003;
}
```

### Database Scaling
- Consider read replicas for analytics
- Implement database sharding for large catalogs
- Use Redis clusters for session storage

### Advanced Features Scaling
- AI services: Implement queuing (Redis/Bull)
- NFT minting: Rate limiting and queuing
- AR processing: CDN for 3D models
- Voice processing: Cloud speech-to-text services

## Troubleshooting

### Common Issues

**AR Features Not Working**
- Check WebXR API support
- Verify HTTPS (required for WebXR)
- Check camera permissions

**Voice Commerce Issues**
- Verify microphone permissions
- Check speech recognition API keys
- Test with different browsers

**NFT Features Failing**
- Verify blockchain connectivity
- Check gas fees and wallet balance
- Validate smart contract addresses

**Performance Issues**
- Check bundle sizes with analyzer
- Verify lazy loading is working
- Monitor database query performance

### Logs and Debugging
```bash
# View application logs
pm2 logs my-store-server

# Database query logs
tail -f /var/log/mysql/mysql.log

# Nginx access logs
tail -f /var/log/nginx/access.log
```

---

This deployment guide ensures your advanced e-commerce platform is production-ready with all cutting-edge features properly configured and optimized.
