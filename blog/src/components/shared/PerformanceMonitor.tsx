import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  logToConsole?: boolean;
  onMetric?: (metric: PerformanceMetric) => void;
}

// Performance thresholds based on Core Web Vitals
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

const getRating = (metricName: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  const threshold = THRESHOLDS[metricName as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
};

export const PerformanceMonitor = ({ 
  enabled = true, 
  logToConsole = false, 
  onMetric 
}: PerformanceMonitorProps) => {
  const observerRef = useRef<PerformanceObserver | null>(null);
  const metricsRef = useRef<Map<string, PerformanceMetric>>(new Map());

  const handleMetric = useCallback((metric: PerformanceMetric) => {
    metricsRef.current.set(metric.name, metric);
    
    if (logToConsole && process.env.NODE_ENV === 'development') {
      console.info(`📊 ${metric.name}: ${metric.value}ms (${metric.rating})`);
    }
    
    onMetric?.(metric);
  }, [logToConsole, onMetric]);

  const measureWebVital = useCallback((entry: PerformanceEntry) => {
    const metric: PerformanceMetric = {
      name: entry.name,
      value: Math.round(entry.startTime + (entry as any).duration || 0),
    };
    
    metric.rating = getRating(entry.name, metric.value);
    handleMetric(metric);
  }, [handleMetric]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe Core Web Vitals
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          // Handle different types of performance entries
          if (entry.entryType === 'largest-contentful-paint') {
            measureWebVital({ ...entry, name: 'LCP' });
          } else if (entry.entryType === 'first-input') {
            measureWebVital({ ...entry, name: 'FID' });
          } else if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            const cls = metricsRef.current.get('CLS')?.value || 0;
            measureWebVital({ ...entry, name: 'CLS', startTime: cls + (entry as any).value });
          } else if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            measureWebVital({ ...entry, name: 'FCP' });
          } else if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            measureWebVital({ 
              ...entry, 
              name: 'TTFB', 
              startTime: navEntry.responseStart - navEntry.requestStart 
            });
          }
        });
      });

      // Observe different performance entry types
      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        // Fallback for browsers that don't support LCP
      }

      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        // Fallback for browsers that don't support FID
      }

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Fallback for browsers that don't support CLS
      }

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        // Fallback for browsers that don't support paint timing
      }

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        // Fallback for browsers that don't support navigation timing
      }

      observerRef.current = observer;

      // Manual memory monitoring
      const monitorMemory = () => {
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          const memoryMetric: PerformanceMetric = {
            name: 'Memory',
            value: Math.round(memory.usedJSHeapSize / 1048576), // Convert to MB
            rating: memory.usedJSHeapSize > 50 * 1048576 ? 'poor' : 'good', // 50MB threshold
          };
          handleMetric(memoryMetric);
        }
      };

      // Monitor memory every 10 seconds in development
      const memoryInterval = process.env.NODE_ENV === 'development' 
        ? setInterval(monitorMemory, 10000) 
        : null;

      return () => {
        observer.disconnect();
        if (memoryInterval) clearInterval(memoryInterval);
      };
    } catch (error) {
      console.warn('Performance monitoring failed to initialize:', error);
    }
  }, [enabled, measureWebVital]);

  // Component doesn't render anything
  return null;
};

// Export utility functions for manual performance tracking
export const trackRenderTime = (componentName: string, renderFn: () => void) => {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    renderFn();
    const duration = performance.now() - start;
    console.info(`🎨 ${componentName} render: ${duration.toFixed(2)}ms`);
  } else {
    renderFn();
  }
};

export const trackAsyncOperation = async function<T>(
  operationName: string, 
  operation: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.info(`⚡ ${operationName}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`❌ ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};

export default PerformanceMonitor;
