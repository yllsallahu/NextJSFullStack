/** 
 * Performance monitoring utilities
 * This file provides utilities to monitor and track performance metrics
 */

// Web Vitals monitoring
export const reportWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Only log performance metrics in production
    switch (metric.name) {
      case 'CLS':
      case 'FID':
      case 'FCP':
      case 'LCP':
      case 'TTFB':
        // You can send these to your analytics service
        console.info(`${metric.name}: ${metric.value}`);
        break;
      default:
        break;
    }
  }
};

// Memory usage monitoring  
export const logMemoryUsage = () => {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    console.info('Memory Usage:', {
      used: `${Math.round(memory.usedJSHeapSize / 1048576)} MB`,
      total: `${Math.round(memory.totalJSHeapSize / 1048576)} MB`,
      limit: `${Math.round(memory.jsHeapSizeLimit / 1048576)} MB`
    });
  }
};

// Bundle size monitoring
export const trackBundleSize = () => {
  if (typeof window !== 'undefined') {
    // Track number of scripts loaded
    const scripts = document.querySelectorAll('script').length;
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]').length;
    
    console.info('Bundle Info:', {
      scripts,
      stylesheets,
      timestamp: new Date().toISOString()
    });
  }
};
