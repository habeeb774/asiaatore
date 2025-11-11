# Development Guide for My-Store Client

This comprehensive guide covers development setup, environment configuration, and advanced features for the my-store client application.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:5173`

## ⚙️ Environment Configuration

### Core Environment Variables

Copy `.env.example` to `.env.local` and configure the following:

```bash
# API Configuration
VITE_API_URL=http://localhost:5713
VITE_PROXY_TARGET=http://localhost:8830

# Application Settings
VITE_APP_NAME=متجرنا الحديث
VITE_APP_SHORT_NAME=المتجر

# Feature Flags
VITE_ENABLE_AI_RECOMMENDATIONS=true
VITE_ENABLE_AR_VIEWER=true
VITE_ENABLE_VOICE_COMMERCE=true
VITE_ENABLE_GAMIFICATION=true
VITE_ENABLE_NFT_LOYALTY=true
```

See `.env.example` for complete configuration options.

## 🎯 Advanced Features

### AI-Powered Recommendations
- **Component**: `src/components/AIProductRecommendations/`
- **Environment**: `VITE_OPENAI_API_KEY`
- **Features**: Collaborative filtering, content-based recommendations

### Augmented Reality Viewer
- **Component**: `src/components/ARProductViewer/`
- **Environment**: `VITE_AR_API_KEY`
- **Features**: WebXR support, 3D product visualization

### Voice Commerce
- **Component**: `src/components/VoiceCommerce/`
- **Environment**: `VITE_SPEECH_API_KEY`
- **Features**: Speech recognition, voice search, conversational AI

### Gamification System
- **Component**: `src/components/Gamification/`
- **Features**: XP/points, badges, challenges, leaderboards

### NFT Loyalty Program
- **Component**: `src/components/NFTLoyalty/`
- **Environment**: `VITE_WEB3_PROVIDER_URL`
- **Features**: Blockchain-inspired digital collectibles, rarity tiers

### Social Commerce
- **Component**: `src/components/SocialCommerce/`
- **Environment**: Social media API keys
- **Features**: User-generated content, social sharing

### Smart Inventory AI
- **Component**: `src/components/SmartInventoryAI/`
- **Environment**: `VITE_INVENTORY_AI_API_URL`
- **Features**: Predictive analytics, automated reordering

### Dynamic Personalization
- **Component**: `src/components/DynamicPersonalization/`
- **Environment**: `VITE_PERSONALIZATION_API_URL`
- **Features**: AI-powered user profiling, custom recommendations

### Sustainability Dashboard
- **Component**: `src/components/Sustainability/`
- **Features**: Carbon footprint tracking, eco-friendly recommendations

## 🔧 Development Tools

### Dev Headers (Server Authentication)

The API server can accept fake auth headers for local development:

```bash
# Start server with dev headers enabled
$env:ALLOW_DEV_HEADERS='true'; node server/index.js
```

### Simulate Logged-in User

Set a fake user in browser console for testing:

```javascript
// Set dev admin user
localStorage.setItem('my_store_user', JSON.stringify({
  id: 'dev-admin',
  role: 'admin'
}));

// Or set a real token
localStorage.setItem('my_store_token', 'your-jwt-token');
```

### VS Code Tasks

Available tasks for common development workflows:
- Start API server with dev headers
- Start Vite development server
- Run tests and linting
- Build for production

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npx playwright test
```

### Performance Testing
```bash
npm run lighthouse
```

## 📱 Progressive Web App (PWA)

The app includes PWA features:
- Service worker for offline functionality
- App manifest for installation
- Background sync for orders
- Push notifications (when enabled)

## 🔒 Security

### Content Security Policy
Enabled in production to prevent XSS attacks.

### HTTPS Redirect
Automatically redirects to HTTPS in production.

### API Security
- CORS configuration
- Request signing for sensitive operations
- Rate limiting on auth endpoints

## 🚀 Deployment

### Build Commands
```bash
# Development build
npm run build

# Production build
NODE_ENV=production npm run build

# Preview production build
npm run preview
```

### Environment Setup
- Set production API keys in deployment platform
- Configure monitoring services (Sentry, LogRocket)
- Set up analytics tracking
- Configure payment providers

## 📊 Monitoring & Analytics

### Error Tracking
```bash
VITE_SENTRY_DSN=your-sentry-dsn
```

### Performance Monitoring
```bash
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### Analytics
```bash
VITE_GA_TRACKING_ID=your-ga-id
VITE_GTM_ID=your-gtm-id
```

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check `VITE_API_URL` configuration
   - Verify server is running on correct port
   - Check CORS settings

2. **Features Not Loading**
   - Verify feature flags are enabled
   - Check required API keys are set
   - Review browser console for errors

3. **Build Failures**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Debug Mode

Enable debug logging:
```bash
VITE_DEBUG=true
```

## 📚 Additional Resources

- [Environment Variables Guide](.env.example)
- [Component Documentation](./src/components/)
- [API Documentation](../server/README.md)
- [Deployment Guide](../DEPLOYMENT.md)
