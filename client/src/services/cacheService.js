// Advanced Image Cache Service
class ImageCacheService {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50; // Maximum cached images
    this.cacheTimeout = 1000 * 60 * 30; // 30 minutes
  }

  // Generate cache key
  generateKey(src, options = {}) {
    const { width, height, quality = 75, format } = options;
    return `${src}_${width || 'auto'}x${height || 'auto'}_q${quality}_${format || 'original'}`;
  }

  // Check if image is cached
  isCached(key) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  // Get cached image
  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Update access time
    cached.lastAccessed = Date.now();
    return cached.blob;
  }

  // Cache image
  async set(key, blob) {
    // Clean up old entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      this.evictOldEntries();
    }

    this.cache.set(key, {
      blob,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  // Evict old entries using LRU strategy
  evictOldEntries() {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = Math.ceil(this.maxCacheSize * 0.2); // Remove 20%
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Preload image
  async preload(src, options = {}) {
    const key = this.generateKey(src, options);

    if (this.isCached(key)) {
      return this.get(key);
    }

    try {
      const response = await fetch(this.buildImageUrl(src, options));
      if (!response.ok) throw new Error('Failed to load image');

      const blob = await response.blob();
      await this.set(key, blob);
      return blob;
    } catch (error) {
      console.warn('Failed to preload image:', src, error);
      return null;
    }
  }

  // Build optimized image URL
  buildImageUrl(src, options = {}) {
    const { width, height, quality = 75, format } = options;

    if (!src) return '';

    let url = src;

    // Add query parameters for optimization
    const params = new URLSearchParams();

    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality && quality !== 75) params.set('q', quality.toString());
    if (format) params.set('f', format);

    const paramString = params.toString();
    if (paramString) {
      url += (url.includes('?') ? '&' : '?') + paramString;
    }

    return url;
  }

  // Clear cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      entries: Array.from(this.cache.keys())
    };
  }
}

// API Response Cache Service
class ApiCacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 1000 * 60 * 5; // 5 minutes default
  }

  // Generate cache key
  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');

    return `${endpoint}?${sortedParams}`;
  }

  // Check if response is cached and valid
  isValid(key, ttl = this.defaultTTL) {
    const cached = this.cache.get(key);
    if (!cached) return false;

    return Date.now() - cached.timestamp < ttl;
  }

  // Get cached response
  get(key) {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  // Cache response
  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Invalidate cache by pattern
  invalidate(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Create singleton instances
export const imageCache = new ImageCacheService();
export const apiCache = new ApiCacheService();

// Cache utilities
export const cacheUtils = {
  // Preload critical images
  preloadCriticalImages: async (images) => {
    const promises = images.map(img =>
      typeof img === 'string'
        ? imageCache.preload(img, { priority: true })
        : imageCache.preload(img.src, img.options)
    );

    return Promise.allSettled(promises);
  },

  // Cache API response
  cacheApiResponse: (endpoint, params, data, ttl) => {
    const key = apiCache.generateKey(endpoint, params);
    apiCache.set(key, data, ttl);
  },

  // Get cached API response
  getCachedApiResponse: (endpoint, params, ttl) => {
    const key = apiCache.generateKey(endpoint, params);
    if (apiCache.isValid(key, ttl)) {
      return apiCache.get(key);
    }
    return null;
  },

  // Clear all caches
  clearAllCaches: () => {
    imageCache.clear();
    apiCache.clear();
  }
};

export default { imageCache, apiCache, cacheUtils };