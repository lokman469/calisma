import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Card, Typography, Box, Button, IconButton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  BarChart, PieChart, LineChart,
  RefreshRounded, MoreVertRounded
} from '@mui/icons-material';

import { useAuth } from '../hooks/useAuth';
import { usePortfolio } from '../hooks/usePortfolio';
import { useMarketData } from '../hooks/useMarketData';
import { useTrade } from '../hooks/useTrade';

import PortfolioChart from '../components/charts/PortfolioChart';
import TradeHistory from '../components/trade/TradeHistory';
import MarketOverview from '../components/market/MarketOverview';
import PerformanceMetrics from '../components/analytics/PerformanceMetrics';
import AlertsList from '../components/alerts/AlertsList';
import NewsWidget from '../components/widgets/NewsWidget';

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const { portfolio, loading: portfolioLoading } = usePortfolio();
  const { marketData, loading: marketLoading } = useMarketData();
  const { tradeHistory, stats, loading: tradeLoading } = useTrade();

  const [timeRange, setTimeRange] = useState('1d');
  const [refreshing, setRefreshing] = useState(false);

  // Portföy değişim istatistikleri
  const portfolioStats = useMemo(() => {
    if (!portfolio) return null;
    
    return {
      totalValue: portfolio.totalValue,
      dailyChange: portfolio.dailyChange,
      dailyChangePercent: portfolio.dailyChangePercent,
      totalPnL: portfolio.totalPnL,
      totalPnLPercent: portfolio.totalPnLPercent
    };
  }, [portfolio]);

  // Performans metrikleri
  const performanceMetrics = useMemo(() => {
    if (!stats) return null;

    return {
      winRate: stats.winRate,
      profitFactor: stats.profitFactor,
      averageWin: stats.averageWin,
      averageLoss: stats.averageLoss,
      maxDrawdown: stats.maxDrawdown,
      sharpeRatio: stats.sharpeRatio
    };
  }, [stats]);

  // Veri yenileme
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Veri yenileme işlemleri
      await Promise.all([
        // Portfolio verilerini yenile
        // Market verilerini yenile
        // Trade verilerini yenile
      ]);
    } catch (error) {
      console.error('Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Zaman aralığı değişimi
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Üst İstatistikler */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Toplam Portföy Değeri
            </Typography>
            <Typography variant="h4">
              ${portfolio?.totalValue.toLocaleString()}
            </Typography>
            <Typography 
              variant="body2" 
              color={portfolioStats?.dailyChange >= 0 ? 'success.main' : 'error.main'}
            >
              {portfolioStats?.dailyChangePercent}% Günlük
            </Typography>
          </Card>
        </Grid>
        {/* Diğer istatistik kartları */}
      </Grid>

      {/* Ana Grafikler */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Portföy Performansı</Typography>
              <Box>
                {/* Zaman aralığı butonları */}
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshRounded />
                </IconButton>
              </Box>
            </Box>
            <PortfolioChart 
              data={portfolio?.history} 
              timeRange={timeRange}
              loading={portfolioLoading}
            />
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" mb={2}>
              Varlık Dağılımı
            </Typography>
            {/* Varlık dağılım grafiği */}
          </Card>
        </Grid>
      </Grid>

      {/* Alt Bileşenler */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Son İşlemler
            </Typography>
            <TradeHistory 
              trades={tradeHistory}
              loading={tradeLoading}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Piyasa Özeti
            </Typography>
            <MarketOverview 
              data={marketData}
              loading={marketLoading}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Performans Metrikleri
            </Typography>
            <PerformanceMetrics 
              metrics={performanceMetrics}
              loading={tradeLoading}
            />
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Haberler & Duyurular
            </Typography>
            <NewsWidget />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 