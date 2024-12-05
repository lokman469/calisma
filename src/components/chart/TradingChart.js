import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Box, Paper, CircularProgress, IconButton, ButtonGroup, Tooltip } from '@mui/material';
import {
  Timeline,
  ShowChart,
  BarChart,
  Add,
  Remove,
  Fullscreen,
  FullscreenExit,
  Settings
} from '@mui/icons-material';
import { createChart, CrosshairMode } from 'lightweight-charts';
import { useTheme } from '@mui/material/styles';
import { useChart } from '../../hooks/useChart';
import { useSettings } from '../../hooks/useSettings';

// Grafik tipleri
const CHART_TYPES = {
  CANDLES: 'candles',
  LINE: 'line',
  AREA: 'area',
  BARS: 'bars'
};

// Zaman dilimleri
const TIMEFRAMES = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1s', value: '60' },
  { label: '4s', value: '240' },
  { label: '1g', value: '1D' }
];

const TradingChart = ({ 
  symbol,
  height = 500,
  indicators = [],
  onCrosshairMove,
  fullscreenEnabled = true
}) => {
  const theme = useTheme();
  const { settings } = useSettings();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  
  // State
  const [chartType, setChartType] = useState(settings.defaultChartType || CHART_TYPES.CANDLES);
  const [timeframe, setTimeframe] = useState(settings.defaultTimeframe || '15');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom hooks
  const { 
    data, 
    loading: dataLoading,
    subscribeToUpdates,
    unsubscribeFromUpdates 
  } = useChart(symbol, timeframe);

  // Grafik renkleri ve stilleri
  const chartOptions = useMemo(() => ({
    layout: {
      background: { color: theme.palette.background.paper },
      textColor: theme.palette.text.primary,
    },
    grid: {
      vertLines: { color: theme.palette.divider },
      horzLines: { color: theme.palette.divider },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        width: 1,
        color: theme.palette.primary.main,
        style: 0,
      },
      horzLine: {
        width: 1,
        color: theme.palette.primary.main,
        style: 0,
      },
    },
    timeScale: {
      borderColor: theme.palette.divider,
      timeVisible: true,
      secondsVisible: false,
    },
    rightPriceScale: {
      borderColor: theme.palette.divider,
    },
  }), [theme]);

  // Grafik oluşturma
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height: height
    });

    // Ana seri oluşturma
    switch (chartType) {
      case CHART_TYPES.CANDLES:
        seriesRef.current.main = chartRef.current.addCandlestickSeries({
          upColor: theme.palette.success.main,
          downColor: theme.palette.error.main,
          borderVisible: false,
          wickUpColor: theme.palette.success.main,
          wickDownColor: theme.palette.error.main,
        });
        break;
      case CHART_TYPES.LINE:
        seriesRef.current.main = chartRef.current.addLineSeries({
          color: theme.palette.primary.main,
          lineWidth: 2,
        });
        break;
      case CHART_TYPES.AREA:
        seriesRef.current.main = chartRef.current.addAreaSeries({
          topColor: theme.palette.primary.main,
          bottomColor: theme.palette.primary.main + '20',
          lineColor: theme.palette.primary.main,
          lineWidth: 2,
        });
        break;
      case CHART_TYPES.BARS:
        seriesRef.current.main = chartRef.current.addBarSeries({
          upColor: theme.palette.success.main,
          downColor: theme.palette.error.main,
        });
        break;
    }

    // İndikatörleri ekle
    indicators.forEach(indicator => {
      seriesRef.current[indicator.id] = chartRef.current.addLineSeries({
        color: indicator.color || theme.palette.secondary.main,
        lineWidth: 1,
        priceScaleId: indicator.overlay ? 'right' : indicator.id,
        priceScale: {
          position: indicator.overlay ? 'right' : 'left',
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
      });
    });

    // Event listeners
    chartRef.current.subscribeCrosshairMove(onCrosshairMove);
    
    // Resize handler
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, [chartType, height, indicators, theme, chartOptions, onCrosshairMove]);

  // Veri güncelleme
  useEffect(() => {
    if (!data || !seriesRef.current.main) return;

    setLoading(true);
    
    // Ana seriyi güncelle
    seriesRef.current.main.setData(data.mainSeries);

    // İndikatörleri güncelle
    indicators.forEach(indicator => {
      if (seriesRef.current[indicator.id] && data[indicator.id]) {
        seriesRef.current[indicator.id].setData(data[indicator.id]);
      }
    });

    // Zaman aralığını ayarla
    chartRef.current.timeScale().fitContent();
    
    setLoading(false);
  }, [data, indicators]);

  // WebSocket aboneliği
  useEffect(() => {
    subscribeToUpdates(symbol, timeframe);
    return () => unsubscribeFromUpdates(symbol, timeframe);
  }, [symbol, timeframe, subscribeToUpdates, unsubscribeFromUpdates]);

  // Tam ekran geçişi
  const toggleFullscreen = () => {
    if (!fullscreenEnabled) return;

    if (!isFullscreen) {
      chartContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <Paper 
      elevation={1}
      sx={{ 
        position: 'relative',
        height: isFullscreen ? '100vh' : height,
        overflow: 'hidden'
      }}
    >
      {(loading || dataLoading) && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0,0,0,0.5)',
            zIndex: 1
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Box
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          display: 'flex',
          gap: 1
        }}
      >
        <ButtonGroup size="small" variant="contained">
          {Object.values(CHART_TYPES).map(type => (
            <Tooltip key={type} title={type.toUpperCase()}>
              <IconButton
                color={chartType === type ? 'primary' : 'default'}
                onClick={() => setChartType(type)}
              >
                {type === CHART_TYPES.CANDLES && <ShowChart />}
                {type === CHART_TYPES.LINE && <Timeline />}
                {type === CHART_TYPES.AREA && <ShowChart />}
                {type === CHART_TYPES.BARS && <BarChart />}
              </IconButton>
            </Tooltip>
          ))}
        </ButtonGroup>

        <ButtonGroup size="small" variant="contained">
          <IconButton onClick={() => chartRef.current.timeScale().zoomOut()}>
            <Remove />
          </IconButton>
          <IconButton onClick={() => chartRef.current.timeScale().zoomIn()}>
            <Add />
          </IconButton>
        </ButtonGroup>

        {fullscreenEnabled && (
          <IconButton
            color="primary"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        )}

        <IconButton
          color="primary"
          onClick={() => {/* Grafik ayarları */}}
        >
          <Settings />
        </IconButton>
      </Box>

      <Box ref={chartContainerRef} sx={{ width: '100%', height: '100%' }} />
    </Paper>
  );
};

export default TradingChart; 