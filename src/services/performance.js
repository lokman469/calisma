class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: {},
      apiCalls: {},
      renders: {},
      errors: []
    };
  }

  // Sayfa yüklenme süresini ölç
  measurePageLoad(pageName) {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.pageLoads[pageName]) {
        this.metrics.pageLoads[pageName] = [];
      }
      this.metrics.pageLoads[pageName].push(duration);

      // 1 saniyeden uzun süren yüklenmeleri logla
      if (duration > 1000) {
        console.warn(`Yavaş sayfa yüklenmesi: ${pageName} (${duration.toFixed(2)}ms)`);
      }
    };
  }

  // API çağrı süresini ölç
  measureApiCall(endpoint) {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.apiCalls[endpoint]) {
        this.metrics.apiCalls[endpoint] = [];
      }
      this.metrics.apiCalls[endpoint].push(duration);

      // 500ms'den uzun süren API çağrılarını logla
      if (duration > 500) {
        console.warn(`Yavaş API ça��rısı: ${endpoint} (${duration.toFixed(2)}ms)`);
      }
    };
  }

  // Component render süresini ölç
  measureRender(componentName) {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      if (!this.metrics.renders[componentName]) {
        this.metrics.renders[componentName] = [];
      }
      this.metrics.renders[componentName].push(duration);

      // 16ms'den uzun süren renderleri logla (60fps için)
      if (duration > 16) {
        console.warn(`Yavaş render: ${componentName} (${duration.toFixed(2)}ms)`);
      }
    };
  }

  // Hata kaydet
  logError(error, context) {
    this.metrics.errors.push({
      timestamp: new Date(),
      error: error.message,
      stack: error.stack,
      context
    });
  }

  // Metrikleri getir
  getMetrics() {
    const calculateStats = (arr) => {
      if (!arr.length) return null;
      return {
        avg: arr.reduce((a, b) => a + b, 0) / arr.length,
        min: Math.min(...arr),
        max: Math.max(...arr),
        count: arr.length
      };
    };

    return {
      pageLoads: Object.entries(this.metrics.pageLoads).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: calculateStats(value)
        }),
        {}
      ),
      apiCalls: Object.entries(this.metrics.apiCalls).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: calculateStats(value)
        }),
        {}
      ),
      renders: Object.entries(this.metrics.renders).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: calculateStats(value)
        }),
        {}
      ),
      errors: this.metrics.errors
    };
  }

  // Metrikleri temizle
  clearMetrics() {
    this.metrics = {
      pageLoads: {},
      apiCalls: {},
      renders: {},
      errors: []
    };
  }
}

export const performanceMonitor = new PerformanceMonitor(); 