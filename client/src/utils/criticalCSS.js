// Critical CSS inlining utilities for performance optimization

// Extract critical CSS for above-the-fold content
export const extractCriticalCSS = () => {
  const criticalCSS = `
    /* Critical CSS for above-the-fold content */
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.5;
      color: #1f2937;
      background-color: #ffffff;
    }
    
    /* Loading skeleton for faster perceived performance */
    .skeleton {
      background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
      border-radius: 0.375rem;
    }
    
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    
    /* Header critical styles */
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 50;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.75rem 1rem;
      will-change: transform;
    }
    
    /* Navigation */
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    
    .logo {
      height: 2.5rem;
      width: auto;
    }
    
    /* Main content area */
    .main-content {
      margin-top: 4rem;
      min-height: calc(100vh - 4rem);
    }
    
    /* Hero section critical styles */
    .hero {
      padding: 3rem 1rem;
      text-align: center;
    }
    
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #1f2937;
    }
    
    .hero p {
      font-size: 1.25rem;
      color: #6b7280;
      margin-bottom: 2rem;
    }
    
    /* Product grid critical styles */
    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1.5rem;
      padding: 2rem 1rem;
    }
    
    .product-card {
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      transition: transform 0.2s;
    }
    
    .product-card:hover {
      transform: translateY(-2px);
    }
    
    .product-image {
      width: 100%;
      height: 200px;
      object-fit: cover;
      background: #f3f4f6;
    }
    
    .product-info {
      padding: 1rem;
    }
    
    .product-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .product-price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #059669;
    }
    
    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0.375rem;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background-color: #059669;
      color: white;
    }
    
    .btn-primary:hover {
      background-color: #047857;
    }
    
    /* Container */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    /* Loading states */
    .loading {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    
    .spinner {
      width: 2rem;
      height: 2rem;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #059669;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Responsive critical styles */
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      
      .hero p {
        font-size: 1.125rem;
      }
      
      .product-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
        padding: 1rem;
      }
    }
  `;

  // Inject critical CSS into the document head
  const style = document.createElement('style');
  style.textContent = criticalCSS;
  style.setAttribute('data-critical', 'true');
  document.head.appendChild(style);

  return criticalCSS;
};

// Inline critical CSS into document head
export const inlineCriticalCSS = () => {
  if (typeof document === 'undefined') return;
  
  const criticalCSS = extractCriticalCSS();
  const styleElement = document.createElement('style');
  styleElement.id = 'critical-css';
  styleElement.textContent = criticalCSS;
  
  // Insert as first style element for highest priority
  const firstStyle = document.querySelector('style');
  if (firstStyle) {
    document.head.insertBefore(styleElement, firstStyle);
  } else {
    document.head.appendChild(styleElement);
  }
};

// Remove critical CSS after page load
export const removeCriticalCSS = () => {
  if (typeof document === 'undefined') return;
  
  const criticalStyle = document.getElementById('critical-css');
  if (criticalStyle) {
    criticalStyle.remove();
  }
};

// Optimize font loading for better LCP
export const optimizeFontLoading = () => {
  if (typeof document === 'undefined') return;
  
  // Preconnect to Google Fonts
  const googleFontsPreconnect = document.createElement('link');
  googleFontsPreconnect.rel = 'preconnect';
  googleFontsPreconnect.href = 'https://fonts.googleapis.com';
  document.head.appendChild(googleFontsPreconnect);
  
  const googleFontsPreconnect2 = document.createElement('link');
  googleFontsPreconnect2.rel = 'preconnect';
  googleFontsPreconnect2.href = 'https://fonts.gstatic.com';
  googleFontsPreconnect2.crossOrigin = 'anonymous';
  document.head.appendChild(googleFontsPreconnect2);
  
  // Load fonts with font-display: swap
  const fontLink = document.createElement('link');
  fontLink.rel = 'stylesheet';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
  fontLink.media = 'print';
  fontLink.onload = function() {
    this.media = 'all';
  };
  document.head.appendChild(fontLink);
};

// Optimize images for better LCP
export const optimizeImages = () => {
  if (typeof document === 'undefined') return;
  
  const images = document.querySelectorAll('img[data-src]');
  
  // Use Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove('lazy');
        imageObserver.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px',
    threshold: 0.01
  });
  
  images.forEach(img => imageObserver.observe(img));
};

// Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof document === 'undefined') return;
  
  // Preload critical JavaScript
  const criticalJS = [
    '/assets/vendor.react-DTAZYMXD.js',
    '/assets/vendor.router-DUdQc3N9.js',
    '/assets/index-xNN03VjE.js'
  ];
  
  criticalJS.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'script';
    document.head.appendChild(link);
  });
  
  // Preload critical CSS
  const criticalCSS = [
    '/assets/index-C4vCtwMc.css',
    '/assets/vendor-Dp5P4A1I.css'
  ];
  
  criticalCSS.forEach(href => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'style';
    document.head.appendChild(link);
  });
};

// Initialize critical optimizations
export const initCriticalOptimizations = () => {
  if (typeof document === 'undefined') return;
  
  // Inline critical CSS immediately
  inlineCriticalCSS();
  
  // Optimize font loading
  optimizeFontLoading();
  
  // Preload critical resources
  preloadCriticalResources();
  
  // Remove critical CSS after full page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      removeCriticalCSS();
      optimizeImages();
    }, 1000);
  });
  
  // Fallback for browsers without load event
  setTimeout(() => {
    removeCriticalCSS();
    optimizeImages();
  }, 5000);
};
