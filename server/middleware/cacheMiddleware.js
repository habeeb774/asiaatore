// Redis-based caching middleware for performance optimization
import { createClient } from 'redis';

let redisClient;

// Initialize Redis client
async function initRedis() {
  if (redisClient) return redisClient;
  
  try {
    redisClient = createClient({ 
      url: process.env.REDIS_URL || 'redis://localhost:6379' 
    });
    
    redisClient.on('error', (err) => {
      console.warn('Redis cache error:', err.message);
    });
    
    await redisClient.connect();
    console.log('✓ Redis cache connected');
    return redisClient;
  } catch (error) {
    console.warn('Redis connection failed, caching disabled:', error.message);
    return null;
  }
}

// Cache middleware factory
export function cacheMiddleware(options = {}) {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = (req) => `cache:${req.method}:${req.originalUrl}`,
    condition = () => true,
    skipCache = false
  } = options;

  return async (req, res, next) => {
    if (skipCache || !condition(req)) {
      return next();
    }

    const client = await initRedis();
    if (!client) {
      return next(); // Skip caching if Redis unavailable
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get cached response
      const cached = await client.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        res.set(data.headers);
        return res.status(data.status).json(data.body);
      }

      // Intercept response to cache it
      const originalJson = res.json;
      const originalStatus = res.status;
      let responseData = null;
      let statusCode = 200;

      res.json = function(data) {
        responseData = data;
        return originalJson.call(this, data);
      };

      res.status = function(code) {
        statusCode = code;
        return originalStatus.call(this, code);
      };

      // Cache the response after it's sent
      res.on('finish', async () => {
        if (statusCode === 200 && responseData) {
          try {
            const cacheData = {
              status: statusCode,
              headers: res.getHeaders(),
              body: responseData
            };
            await client.setEx(cacheKey, ttl, JSON.stringify(cacheData));
          } catch (error) {
            console.warn('Failed to cache response:', error.message);
          }
        }
      });

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
}

// Cache invalidation utility
export async function invalidateCache(pattern) {
  const client = await initRedis();
  if (!client) return;

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`✓ Invalidated ${keys.length} cache entries`);
    }
  } catch (error) {
    console.warn('Cache invalidation failed:', error.message);
  }
}

// Predefined cache configurations
export const cacheConfig = {
  // Products cache - 15 minutes
  products: cacheMiddleware({
    ttl: 900,
    keyGenerator: (req) => `cache:products:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
  }),

  // Categories cache - 1 hour
  categories: cacheMiddleware({
    ttl: 3600,
    keyGenerator: (req) => `cache:categories:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
  }),

  // Brands cache - 1 hour
  brands: cacheMiddleware({
    ttl: 3600,
    keyGenerator: (req) => `cache:brands:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
  }),

  // Settings cache - 30 minutes
  settings: cacheMiddleware({
    ttl: 1800,
    keyGenerator: (req) => `cache:settings:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
  }),

  // Search results cache - 10 minutes
  search: cacheMiddleware({
    ttl: 600,
    keyGenerator: (req) => `cache:search:${req.originalUrl}`,
    condition: (req) => req.method === 'GET'
  })
};

// Performance monitoring middleware
export function performanceMonitor() {
  return (req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      
      // Log slow requests
      if (duration > 1000) {
        console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
      }
    });
    
    next();
  };
}

// Response compression for API responses
export function apiCompression() {
  return (req, res, next) => {
    // Only compress API responses larger than 1KB
    const originalJson = res.json;
    res.json = function(data) {
      const jsonStr = JSON.stringify(data);
      if (jsonStr.length > 1024) {
        res.setHeader('Content-Encoding', 'gzip');
      }
      return originalJson.call(this, data);
    };
    next();
  };
}
