import { useEffect, useRef } from 'react';
import { performanceMonitor } from '../services/performance';

// Sayfa yükleme performansını ölç
export function usePageLoadMetrics(pageName) {
  useEffect(() => {
    const endMeasure = performanceMonitor.measurePageLoad(pageName);
    return endMeasure;
  }, [pageName]);
}

// Component render performansını ölç
export function useRenderMetrics(componentName) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    const endMeasure = performanceMonitor.measureRender(
      `${componentName} (Render #${renderCount.current})`
    );
    return endMeasure;
  });
}

// API çağrı performansını ölç
export function useApiMetrics(endpoint) {
  const startMeasure = () => performanceMonitor.measureApiCall(endpoint);
  return startMeasure;
} 