// Enhanced Analytics Service with advanced tracking and user behavior analysis
class AnalyticsService {
  constructor() {
    this.isInitialized = false;
    this.queue = [];
    this.userId = null;
    this.sessionId = null;
    this.pageStartTime = Date.now();
    this.events = [];
    this.engagement = {
      scrollDepth: 0,
      timeOnPage: 0,
      clicks: 0,
      hovers: 0
    };
    this.config = {
      gaId: null,
      gadsId: null,
      gadsConversionLabel: null,
      debug: false
    };
  }

  // Initialize analytics
  init() {
    if (this.isInitialized) return;

    this.config.gaId = import.meta?.env?.VITE_GA_ID;
    this.config.gadsId = import.meta?.env?.VITE_GADS_ID;
    this.config.gadsConversionLabel = import.meta?.env?.VITE_GADS_CONVERSION_LABEL;

    if (!this.config.gaId) return; // no-op if not configured

    try {
      // Initialize Google Analytics 4
      window.dataLayer = window.dataLayer || [];
      function gtag(){ window.dataLayer.push(arguments); }
      window.gtag = window.gtag || gtag;

      gtag('js', new Date());
      gtag('config', this.config.gaId, {
        send_page_view: false, // we'll track manually
        custom_map: {
          dimension1: 'user_type',
          dimension2: 'session_id',
          metric1: 'page_views',
          metric2: 'time_on_page'
        }
      });

      // Inject gtag script
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.config.gaId)}`;
      document.head.appendChild(s);

      this.generateSessionId();
      this.setupEngagementTracking();
      this.trackSessionStart();

      this.isInitialized = true;

      // Process queued events
      this.processQueue();

      console.log('[Analytics] Enhanced analytics initialized');
    } catch (error) {
      console.error('[Analytics] Initialization failed:', error);
    }
  }

  // Generate unique session ID
  generateSessionId() {
    this.sessionId = localStorage.getItem('analytics_session_id');
    if (!this.sessionId) {
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('analytics_session_id', this.sessionId);
    }
  }

  // Get or create user ID
  getUserId() {
    if (!this.userId) {
      this.userId = localStorage.getItem('analytics_user_id');
      if (!this.userId) {
        this.userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('analytics_user_id', this.userId);
      }
    }
    return this.userId;
  }

  // Setup automatic engagement tracking
  setupEngagementTracking() {
    // Scroll depth tracking
    let maxScrollDepth = 0;
    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      const scrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.engagement.scrollDepth = maxScrollDepth;
      }
    };

    window.addEventListener('scroll', trackScroll, { passive: true });

    // Click tracking
    document.addEventListener('click', (e) => {
      this.engagement.clicks++;
      this.trackEvent('click', {
        element: e.target.tagName.toLowerCase(),
        class: e.target.className,
        id: e.target.id,
        text: e.target.textContent?.slice(0, 50)
      });
    }, { passive: true });

    // Hover tracking (throttled)
    let hoverTimeout;
    document.addEventListener('mouseover', (e) => {
      if (hoverTimeout) clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        this.engagement.hovers++;
        this.trackEvent('hover', {
          element: e.target.tagName.toLowerCase(),
          class: e.target.className,
          duration: 500
        });
      }, 500);
    }, { passive: true });

    // Time on page tracking
    const timeInterval = setInterval(() => {
      this.engagement.timeOnPage = Math.floor((Date.now() - this.pageStartTime) / 1000);
    }, 1000);

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.trackEngagementData();
      clearInterval(timeInterval);
    });
  }

  // Track session start
  trackSessionStart() {
    this.trackEvent('session_start', {
      session_id: this.sessionId,
      user_id: this.getUserId(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: Date.now()
    });
  }

  // Track page view
  trackPageView(path, title) {
    if (!this.isInitialized) {
      this.queue.push(['pageview', path, title]);
      return;
    }

    const pageViewData = {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href,
      session_id: this.sessionId,
      user_id: this.getUserId(),
      timestamp: Date.now()
    };

    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
        custom_parameters: {
          session_id: this.sessionId,
          user_id: this.getUserId()
        }
      });
    }

    this.sendToCustomAnalytics('page_view', pageViewData);
  }

  // Track custom events
  trackEvent(name, params = {}) {
    if (!this.isInitialized) {
      this.queue.push(['event', name, params]);
      return;
    }

    const eventData = {
      event_name: name,
      session_id: this.sessionId,
      user_id: this.getUserId(),
      timestamp: Date.now(),
      url: window.location.href,
      ...params
    };

    if (window.gtag) {
      window.gtag('event', name, params);
    }

    this.events.push(eventData);
    this.sendToCustomAnalytics('event', eventData);
  }

  // Track e-commerce events
  trackEcommerce(action, data) {
    const ecommerceData = {
      action,
      ...data,
      session_id: this.sessionId,
      user_id: this.getUserId(),
      timestamp: Date.now()
    };

    if (window.gtag) {
      switch (action) {
        case 'view_item':
          window.gtag('event', 'view_item', {
            currency: 'SAR',
            value: data.price,
            items: [{
              item_id: data.product_id,
              item_name: data.product_name,
              category: data.category,
              price: data.price
            }]
          });
          break;

        case 'add_to_cart':
          window.gtag('event', 'add_to_cart', {
            currency: 'SAR',
            value: data.price * (data.quantity || 1),
            items: [{
              item_id: data.product_id,
              item_name: data.product_name,
              category: data.category,
              price: data.price,
              quantity: data.quantity || 1
            }]
          });
          break;

        case 'purchase':
          window.gtag('event', 'purchase', {
            transaction_id: data.order_id,
            currency: 'SAR',
            value: data.total,
            items: data.items?.map(item => ({
              item_id: item.product_id,
              item_name: item.name,
              category: item.category,
              price: item.price,
              quantity: item.quantity
            })) || []
          });
          break;
      }
    }

    this.sendToCustomAnalytics('ecommerce', ecommerceData);
  }

  // Track engagement data
  trackEngagementData() {
    this.trackEvent('engagement_summary', {
      scroll_depth: this.engagement.scrollDepth,
      time_on_page: this.engagement.timeOnPage,
      clicks: this.engagement.clicks,
      hovers: this.engagement.hovers
    });
  }

  // Track conversion
  trackConversion({ sendTo, value, currency, eventLabel } = {}) {
    const GADS_ID = this.config.gadsId;
    const LABEL = this.config.gadsConversionLabel;

    if (!GADS_ID || !window.gtag) return;

    const target = sendTo || `${GADS_ID}/${LABEL || ''}`.replace(/\/$/, '');

    window.gtag('event', 'conversion', {
      send_to: target,
      value: value || 0,
      currency: currency || 'SAR',
      event_label: eventLabel || undefined
    });

    this.sendToCustomAnalytics('conversion', {
      send_to: target,
      value,
      currency,
      event_label: eventLabel,
      session_id: this.sessionId,
      user_id: this.getUserId(),
      timestamp: Date.now()
    });
  }

  // Send data to custom analytics endpoint
  async sendToCustomAnalytics(type, data) {
    try {
      // Store locally first
      this.storeLocally(type, data);

      // Send to server if online
      if (navigator.onLine) {
        await fetch('/api/analytics/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, data })
        }).catch(() => {
          // Ignore network errors
        });
      }
    } catch (error) {
      console.warn('[Analytics] Failed to send analytics data:', error);
    }
  }

  // Store analytics data locally
  storeLocally(type, data) {
    try {
      const key = `analytics_${type}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      existing.push(data);

      // Keep only last 50 events per type
      if (existing.length > 50) {
        existing.splice(0, existing.length - 50);
      }

      localStorage.setItem(key, JSON.stringify(existing));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  // Process queued events
  processQueue() {
    while (this.queue.length > 0) {
      const [type, ...args] = this.queue.shift();
      switch (type) {
        case 'pageview':
          this.trackPageView(...args);
          break;
        case 'event':
          this.trackEvent(...args);
          break;
      }
    }
  }

  // Get analytics data for debugging
  getAnalyticsData() {
    return {
      userId: this.getUserId(),
      sessionId: this.sessionId,
      eventsCount: this.events.length,
      engagement: this.engagement,
      pageStartTime: this.pageStartTime,
      timeOnPage: Math.floor((Date.now() - this.pageStartTime) / 1000)
    };
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

// Export enhanced functions
export function initAnalytics() {
  analytics.init();
}

export function trackPageView(path, title) {
  analytics.trackPageView(path, title);
}

export function trackEvent(name, params = {}) {
  analytics.trackEvent(name, params);
}

export function trackEcommerce(action, data) {
  analytics.trackEcommerce(action, data);
}

export function trackConversion({ sendTo, value, currency, eventLabel } = {}) {
  analytics.trackConversion({ sendTo, value, currency, eventLabel });
}

// Additional enhanced functions
export function trackProductView(product) {
  analytics.trackEcommerce('view_item', {
    product_id: product.id,
    product_name: product.nameEn || product.nameAr,
    category: product.category,
    price: product.price
  });
}

export function trackAddToCart(product, quantity = 1) {
  analytics.trackEcommerce('add_to_cart', {
    product_id: product.id,
    product_name: product.nameEn || product.nameAr,
    category: product.category,
    price: product.price,
    quantity
  });
}

export function trackPurchase(order) {
  analytics.trackEcommerce('purchase', {
    order_id: order.id,
    total: order.grandTotal,
    items: order.items?.map(item => ({
      product_id: item.productId,
      name: item.nameEn || item.nameAr,
      category: item.category,
      price: item.price,
      quantity: item.quantity
    })) || []
  });
}

export function getAnalyticsData() {
  return analytics.getAnalyticsData();
}
