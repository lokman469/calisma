import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useMarketData } from './useMarketData';
import { useSettings } from './useSettings';
import { useIndicators } from './useIndicators';

const CHART_TYPES = {
  CANDLESTICK: 'candlestick',
  LINE: 'line',
  AREA: 'area',
  BAR: 'bar',
  HEIKIN_ASHI: 'heikin_ashi'
};

const TIME_FRAMES = {
  M1: '1m',
  M5: '5m',
  M15: '15m',
  M30: '30m',
  H1: '1h',
  H4: '4h',
  D1: '1d',
  W1: '1w'
};

const STYLES = {
  TRADING_VIEW: 'trading_view',
  DARK: 'dark',
  LIGHT: 'light',
  CUSTOM: 'custom'
};

const OVERLAY_TYPES = {
  MA: 'moving_average',
  EMA: 'exponential_ma',
  VOLUME: 'volume',
  TRADES: 'trades',
  ORDERS: 'orders'
};

export const useChart = (symbol, options = {}) => {
  const [chartData, setChartData] = useState([]);
  const [overlays, setOverlays] = useState([]);
  const [drawings, setDrawings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const chartRef = useRef(null);
  const canvasRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const animationFrameRef = useRef(null);
  const drawingLayerRef = useRef(null);

  const { marketData } = useMarketData();
  const { settings } = useSettings();
  const { calculateIndicator } = useIndicators();

  const {
    type = CHART_TYPES.CANDLESTICK,
    timeframe = TIME_FRAMES.H1,
    style = STYLES.TRADING_VIEW,
    enableZoom = true,
    enablePan = true,
    showVolume = true,
    showGrid = true,
    showLegend = true,
    showCrosshair = true,
    enableAnimation = true,
    maxDataPoints = 1000,
    updateInterval = 1000
  } = options;

  // Canvas boyutlarını güncelle
  const updateDimensions = useCallback(() => {
    if (!chartRef.current) return;

    const { width, height } = chartRef.current.getBoundingClientRect();
    setDimensions({ width, height });

    if (canvasRef.current) {
      canvasRef.current.width = width * window.devicePixelRatio;
      canvasRef.current.height = height * window.devicePixelRatio;
      canvasRef.current.style.width = `${width}px`;
      canvasRef.current.style.height = `${height}px`;
    }
  }, []);

  // Mum verilerini hazırla
  const prepareChartData = useCallback((rawData) => {
    if (!rawData || !rawData.length) return [];

    return rawData.map(candle => ({
      timestamp: new Date(candle.timestamp),
      open: parseFloat(candle.open),
      high: parseFloat(candle.high),
      low: parseFloat(candle.low),
      close: parseFloat(candle.close),
      volume: parseFloat(candle.volume),
      trades: candle.trades,
      color: candle.close > candle.open ? '#26a69a' : '#ef5350'
    }));
  }, []);

  // Overlay ekle/kaldır
  const toggleOverlay = useCallback((type, params = {}) => {
    setOverlays(prev => {
      const exists = prev.find(o => o.type === type);
      if (exists) {
        return prev.filter(o => o.type !== type);
      }
      return [...prev, { type, params }];
    });
  }, []);

  // Çizim ekle
  const addDrawing = useCallback((type, points, style = {}) => {
    const drawing = {
      id: `drawing_${Date.now()}`,
      type,
      points,
      style,
      timestamp: Date.now()
    };

    setDrawings(prev => [...prev, drawing]);
    return drawing.id;
  }, []);

  // Çizim sil
  const removeDrawing = useCallback((drawingId) => {
    setDrawings(prev => prev.filter(d => d.id !== drawingId));
  }, []);

  // Grafik çiz
  const drawChart = useCallback(() => {
    if (!canvasRef.current || !chartData.length) return;

    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = dimensions;

    // Canvas'ı temizle
    ctx.clearRect(0, 0, width, height);

    // Grid çiz
    if (showGrid) {
      drawGrid(ctx, width, height);
    }

    // Mumları çiz
    drawCandles(ctx, chartData, width, height);

    // Volume çiz
    if (showVolume) {
      drawVolume(ctx, chartData, width, height);
    }

    // Overlayları çiz
    overlays.forEach(overlay => {
      drawOverlay(ctx, overlay, chartData, width, height);
    });

    // Çizimleri çiz
    drawings.forEach(drawing => {
      drawDrawing(ctx, drawing, width, height);
    });

    // Crosshair çiz
    if (showCrosshair) {
      drawCrosshair(ctx, width, height);
    }

    // Legend çiz
    if (showLegend) {
      drawLegend(ctx, width, height);
    }

  }, [dimensions, chartData, overlays, drawings, showGrid, showVolume, showCrosshair, showLegend]);

  // Animasyon frame'i
  const animate = useCallback(() => {
    if (!enableAnimation) return;

    drawChart();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [enableAnimation, drawChart]);

  // Zoom işlemi
  const handleZoom = useCallback((event) => {
    if (!enableZoom) return;

    const { deltaY } = event;
    const direction = deltaY > 0 ? -1 : 1;
    const factor = 1 + direction * 0.1;

    // Zoom işlemini uygula
    // ...

  }, [enableZoom]);

  // Pan işlemi
  const handlePan = useCallback((event) => {
    if (!enablePan) return;

    const { movementX, movementY } = event;

    // Pan işlemini uygula
    // ...

  }, [enablePan]);

  // Market verilerini dinle
  useEffect(() => {
    if (!symbol) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await marketData.getCandles(symbol, timeframe, maxDataPoints);
        setChartData(prepareChartData(data));
        setError(null);
      } catch (err) {
        console.error('Chart data hatası:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, updateInterval);

    return () => {
      clearInterval(interval);
    };
  }, [symbol, timeframe, maxDataPoints, updateInterval, marketData, prepareChartData]);

  // Resize observer
  useEffect(() => {
    if (!chartRef.current) return;

    resizeObserverRef.current = new ResizeObserver(updateDimensions);
    resizeObserverRef.current.observe(chartRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateDimensions]);

  // Animasyon
  useEffect(() => {
    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  // Event listeners
  useEffect(() => {
    if (!chartRef.current) return;

    const element = chartRef.current;

    element.addEventListener('wheel', handleZoom);
    element.addEventListener('mousemove', handlePan);

    return () => {
      element.removeEventListener('wheel', handleZoom);
      element.removeEventListener('mousemove', handlePan);
    };
  }, [handleZoom, handlePan]);

  // Memoized değerler
  const chartState = useMemo(() => ({
    type,
    timeframe,
    style,
    dimensions,
    overlays: overlays.length,
    drawings: drawings.length,
    dataPoints: chartData.length,
    lastUpdate: chartData[chartData.length - 1]?.timestamp
  }), [type, timeframe, style, dimensions, overlays, drawings, chartData]);

  return {
    chartRef,
    canvasRef,
    chartData,
    dimensions,
    overlays,
    drawings,
    loading,
    error,
    toggleOverlay,
    addDrawing,
    removeDrawing,
    updateDimensions,
    state: chartState
  };
}; 