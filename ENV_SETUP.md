# Environment Variables Setup Guide

## 📁 Environment Files Structure

This project uses multiple environment files for different purposes and environments:

### Root Level (Server/API)
- **`.env`** - Main environment file (development)
- **`.env.development`** - Development-specific server variables
- **`.env.staging`** - Staging environment variables
- **`.env.production`** - Production environment variables
- **`.env.example`** - Template with all available options
- **`.vercel-build.env`** - Vercel build-specific variables

### Client Level (Frontend)
- **`client/.env`** - Default client environment
- **`client/.env.development`** - Development-specific overrides
- **`client/.env.staging`** - Staging environment overrides
- **`client/.env.production`** - Production-specific settings
- **`client/.env.local`** - Local overrides (not committed)
- **`client/.env.example`** - Client environment template

## 🚀 Quick Setup

### For Development

1. **Copy environment files:**
   ```bash
   # Server environment
   cp .env.example .env

   # Client environment
   cd client
   cp .env.example .env.local
   ```

2. **Start development servers:**
   ```bash
   # Terminal 1: Start API server
   npm run dev:server

   # Terminal 2: Start frontend
   cd client && npm run dev
   ```

## 📋 Environment Variables Reference

### 🔧 Core Configuration

#### Database
```bash
# Railway (default)
DATABASE_URL=mysql://root:AlvYFhUfDYXSCykrgHpncurIFgwffLmF@yamabiko.proxy.rlwy.net:23471/railway

# Local MySQL
DATABASE_URL=mysql://root:root@localhost:3306/my_store_db
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root
DB_NAME=my_store_db
```

#### Authentication
```bash
AUTH_SECRET='your-secret-key-here'
JWT_SECRET=${AUTH_SECRET}
COOKIE_SECRET=${AUTH_SECRET}
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d
```

#### API Configuration
```bash
PORT=8829
NODE_ENV=development
SERVE_CLIENT=true
ALLOW_INVALID_DB=false
ALLOW_DEV_HEADERS=true
```

### 🌐 Client Configuration

#### API Connection
```bash
VITE_API_URL=/api
VITE_PROXY_TARGET=http://localhost:8829
VITE_API_TIMEOUT_MS=12000
```

#### Application Info
```bash
VITE_APP_NAME=متجر منفذ آسيا
VITE_APP_SHORT_NAME=متجر منفذ آسيا
VITE_APP_DESC=متجر إلكتروني حديث للمنتجات والعروض اليومية
VITE_APP_VERSION=1.0.0
```

### 💰 Payment Services

#### PayPal
```bash
PAYPAL_CLIENT_ID=<YOUR_PAYPAL_CLIENT_ID>
PAYPAL_SECRET=<YOUR_PAYPAL_SECRET>
PAYPAL_API=https://api-m.sandbox.paypal.com
PAYPAL_RETURN_URL=https://yourdomain.com/checkout/success
PAYPAL_CANCEL_URL=https://yourdomain.com/checkout/cancel
```

#### STC Pay (Saudi Arabia)
```bash
STC_API_KEY=<YOUR_STC_API_KEY>
STC_SECRET=<YOUR_STC_SECRET>
STC_MERCHANT_ID=<YOUR_STC_MERCHANT_ID>
STC_API_URL=https://api.stc.com.sa
```

### 📱 WhatsApp Integration

#### Meta WhatsApp Cloud API
```bash
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=meta
WHATSAPP_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN>
WHATSAPP_PHONE_NUMBER_ID=<YOUR_PHONE_NUMBER_ID>
```

#### Twilio WhatsApp
```bash
WHATSAPP_ENABLED=true
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<YOUR_ACCOUNT_SID>
TWILIO_AUTH_TOKEN=<YOUR_AUTH_TOKEN>
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### 📊 Analytics & Monitoring

```bash
# Google Analytics
VITE_GA_TRACKING_ID=G-XXXXXXXXXX

# Google Tag Manager
VITE_GTM_ID=GTM-XXXXXXX

# Error Tracking
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project

# Performance Monitoring
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 🤖 AI & ML Services

```bash
VITE_OPENAI_API_KEY=<YOUR_OPENAI_KEY>
VITE_RECOMMENDATION_API_URL=https://api.recommendations.example.com
VITE_PERSONALIZATION_API_URL=https://api.personalization.example.com
VITE_INVENTORY_AI_API_URL=https://api.inventory-ai.example.com
```

### ⚡ Feature Flags

```bash
VITE_ENABLE_AI_RECOMMENDATIONS=true
VITE_ENABLE_AR_VIEWER=true
VITE_ENABLE_VOICE_COMMERCE=true
VITE_ENABLE_GAMIFICATION=true
VITE_ENABLE_NFT_LOYALTY=true
VITE_ENABLE_SOCIAL_COMMERCE=true
VITE_ENABLE_SMART_INVENTORY=true
VITE_ENABLE_PERSONALIZATION=true
VITE_ENABLE_SUSTAINABILITY=true
```

### 🛡️ Security & Performance

```bash
# Rate Limiting
RATE_LIMIT_API_ENABLE=true
RATE_LIMIT_API_MAX=500
RATE_LIMIT_API_WINDOW_MS=1800000

# CORS
CORS_ORIGIN=https://yourdomain.com
TRUST_PROXY=false

# Content Security Policy
VITE_CSP_ENABLED=true
VITE_ENABLE_HTTPS_REDIRECT=true
```

## 🔄 Environment File Priority

Environment variables are loaded in this order (later files override earlier ones):

### Server-side (Node.js)
1. **System environment variables**
2. **`.env`** (root level)
3. **`.env.local`** (root level, not committed)
4. **`.env.development`** / **`.env.staging`** / **`.env.production`** (based on NODE_ENV)

### Client-side (Vite)
1. **System environment variables** (with VITE_ prefix)
2. **`client/.env`** (base client environment)
3. **`client/.env.local`** (local overrides, not committed)
4. **`client/.env.development`** / **`.env.staging`** / **`.env.production`** (based on NODE_ENV)

## 🌍 Environment-Specific Values

### Development Environment
- **Database**: Local PostgreSQL/MySQL
- **API URL**: http://localhost:8829/api
- **Payment**: Sandbox/Test keys
- **Logging**: Debug level enabled
- **Features**: All features enabled for testing

### Staging Environment
- **Database**: Staging database server
- **API URL**: https://staging.your-domain.com/api
- **Payment**: Sandbox/Test keys
- **Logging**: Info level
- **Features**: Production-like configuration

### Production Environment
- **Database**: Production database server
- **API URL**: https://your-domain.com/api
- **Payment**: Live production keys
- **Logging**: Error level only
- **Features**: Optimized for performance

## 🚀 Deployment Checklist

### Production Setup

1. **Set production secrets:**
   ```bash
   # Database
   DATABASE_URL=your_production_db_url

   # Authentication
   AUTH_SECRET=your_secure_secret_key

   # Payment services
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_SECRET=your_paypal_secret

   # Analytics
   VITE_GA_TRACKING_ID=your_ga_id
   VITE_SENTRY_DSN=your_sentry_dsn
   ```

2. **Configure CORS:**
   ```bash
   CORS_ORIGIN=https://yourdomain.com
   TRUST_PROXY=true
   ```

3. **Enable security features:**
   ```bash
   VITE_CSP_ENABLED=true
   VITE_ENABLE_HTTPS_REDIRECT=true
   VITE_ENABLE_PERFORMANCE_MONITORING=true
   ```

4. **Set production URLs:**
   ```bash
   APP_BASE_URL=https://yourdomain.com
   PAYPAL_RETURN_URL=https://yourdomain.com/checkout/success
   PAYPAL_CANCEL_URL=https://yourdomain.com/checkout/cancel
   ```

### Vercel Deployment

For Vercel deployments, set these environment variables in the Vercel dashboard:

```bash
# Required
DATABASE_URL=your_db_url
AUTH_SECRET=your_secret
PAYPAL_CLIENT_ID=your_paypal_id
PAYPAL_SECRET=your_paypal_secret

# Optional
NODE_ENV=production
VERCEL_ENV=production
```

## 🔐 Security Best Practices

1. **Never commit secrets** to version control
2. **Use different keys** for each environment
3. **Rotate keys regularly** (especially production)
4. **Monitor API usage** and set up alerts
5. **Use HTTPS** in production
6. **Enable CSP** and other security headers

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_URL` and `VITE_PROXY_TARGET`
   - Ensure API server is running on correct port

2. **Database Connection Failed**
   - Verify `DATABASE_URL` format
   - Check database server is running
   - Use `ALLOW_INVALID_DB=true` for testing

3. **Authentication Issues**
   - Verify `AUTH_SECRET` is set
   - Check JWT token expiration settings

4. **Payment Integration Failed**
   - Verify payment provider credentials
   - Check webhook URLs are correct
   - Ensure CORS allows payment provider domains

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug
DEBUG_ERRORS=true
VITE_SHOW_RQ_DEVTOOLS=1
```

## 📞 Support

For environment configuration issues:
1. Check the `.env.example` files for all available options
2. Verify variable names match exactly (case-sensitive)
3. Restart servers after changing environment variables
4. Check server logs for configuration errors