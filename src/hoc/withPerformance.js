import React, { memo, useCallback } from 'react';
import { useRenderMetrics } from '../hooks/usePerformance';

export function withPerformance(WrappedComponent, options = {}) {
  const { name = WrappedComponent.displayName || WrappedComponent.name } = options;

  function PerformanceComponent(props) {
    useRenderMetrics(name);

    // Props değişimlerini logla
    const logPropsChange = useCallback((prevProps, nextProps) => {
      const changes = Object.keys(nextProps).filter(
        key => prevProps[key] !== nextProps[key]
      );
      
      if (changes.length > 0) {
        console.log(`[${name}] Props değişti:`, changes);
      }
    }, []);

    return <WrappedComponent {...props} />;
  }

  // Gereksiz renderleri önle
  return memo(PerformanceComponent, (prevProps, nextProps) => {
    logPropsChange(prevProps, nextProps);
    return Object.keys(prevProps).every(
      key => prevProps[key] === nextProps[key]
    );
  });
} 