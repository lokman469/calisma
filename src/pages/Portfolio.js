import React, { useState, useMemo } from 'react';
import { 
  Box, Card, Grid, Typography, Tabs, Tab, 
  Button, IconButton, Menu, MenuItem,
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow 
} from '@mui/material';
import { 
  MoreVert, Refresh, Download, 
  TrendingUp, TrendingDown 
} from '@mui/icons-material';

import { usePortfolio } from '../hooks/usePortfolio';
import { useMarketData } from '../hooks/useMarketData';
import { useExport } from '../hooks/useExport';

import PortfolioChart from '../components/charts/PortfolioChart';
import PortfolioStats from '../components/portfolio/PortfolioStats';
import AssetAllocation from '../components/portfolio/AssetAllocation';
import PerformanceMetrics from '../components/portfolio/PerformanceMetrics';
import TransactionHistory from '../components/portfolio/TransactionHistory';
import PnLAnalysis from '../components/portfolio/PnLAnalysis';

// Zaman aralıkları
const TIME_RANGES = [
  { label: '24s', value: '1d' },
  { label: '7g', value: '7d' },
  { label: '30g', value: '30d' },
  { label: '90g', value: '90d' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Tümü', value: 'all' }
];

const Portfolio = () => {
  // Custom hooks
  const { 
    portfolio, 
    transactions,
    stats,
    loading: portfolioLoading,
    refresh: refreshPortfolio
  } = usePortfolio();
  
  const { marketData } = useMarketData();
  const { exportData } = useExport();

  // State
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState(0);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Portföy özeti
  const portfolioSummary = useMemo(() => {
    if (!portfolio) return null;

    return {
      totalValue: portfolio.totalValue,
      totalPnL: portfolio.totalPnL,
      totalPnLPercent: portfolio.totalPnLPercent,
      dailyChange: portfolio.dailyChange,
      dailyChangePercent: portfolio.dailyChangePercent,
      assets: portfolio.assets.length,
      transactions: transactions.length
    };
  }, [portfolio, transactions]);

  // Varlık dağılımı
  const assetAllocation = useMemo(() => {
    if (!portfolio?.assets) return [];

    return portfolio.assets.map(asset => ({
      symbol: asset.symbol,
      value: asset.value,
      percentage: (asset.value / portfolio.totalValue) * 100,
      pnl: asset.pnl,
      pnlPercent: asset.pnlPercent
    }));
  }, [portfolio]);

  // Performans metrikleri
  const performanceMetrics = useMemo(() => {
    if (!stats) return null;

    return {
      sharpeRatio: stats.sharpeRatio,
      sortino: stats.sortino,
      maxDrawdown: stats.maxDrawdown,
      volatility: stats.volatility,
      beta: stats.beta,
      alpha: stats.alpha
    };
  }, [stats]);

  // Yenileme
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshPortfolio();
    } finally {
      setRefreshing(false);
    }
  };

  // Dışa aktarma
  const handleExport = async (format) => {
    try {
      await exportData('portfolio', {
        summary: portfolioSummary,
        assets: assetAllocation,
        transactions,
        timeRange
      }, format);
      setMenuAnchor(null);
    } catch (error) {
      console.error('Dışa aktarma hatası:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Üst Panel - Özet */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h5">
                Portföy Özeti
              </Typography>
              <Box>
                <IconButton onClick={handleRefresh} disabled={refreshing}>
                  <Refresh />
                </IconButton>
                <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={menuAnchor}
                  open={Boolean(menuAnchor)}
                  onClose={() => setMenuAnchor(null)}
                >
                  <MenuItem onClick={() => handleExport('csv')}>
                    <Download sx={{ mr: 1 }} /> CSV olarak indir
                  </MenuItem>
                  <MenuItem onClick={() => handleExport('pdf')}>
                    <Download sx={{ mr: 1 }} /> PDF olarak indir
                  </MenuItem>
                </Menu>
              </Box>
            </Box>
            <PortfolioStats 
              data={portfolioSummary}
              loading={portfolioLoading}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Ana Panel - Grafik ve Dağılım */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">
                Portföy Performansı
              </Typography>
              <Box>
                {TIME_RANGES.map(range => (
                  <Button
                    key={range.value}
                    size="small"
                    variant={timeRange === range.value ? 'contained' : 'text'}
                    onClick={() => setTimeRange(range.value)}
                    sx={{ ml: 1 }}
                  >
                    {range.label}
                  </Button>
                ))}
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
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Varlık Dağılımı
            </Typography>
            <AssetAllocation 
              data={assetAllocation}
              loading={portfolioLoading}
            />
          </Card>
        </Grid>
      </Grid>

      {/* Alt Panel - Detaylar */}
      <Card>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
          <Tab label="Varlıklar" />
          <Tab label="İşlemler" />
          <Tab label="Performans" />
          <Tab label="PnL Analizi" />
        </Tabs>
        <Box sx={{ p: 2 }}>
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Varlık</TableCell>
                    <TableCell align="right">Miktar</TableCell>
                    <TableCell align="right">Fiyat</TableCell>
                    <TableCell align="right">Değer</TableCell>
                    <TableCell align="right">Dağılım</TableCell>
                    <TableCell align="right">24s Değişim</TableCell>
                    <TableCell align="right">Toplam PnL</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolio?.assets.map(asset => (
                    <TableRow key={asset.symbol}>
                      <TableCell>{asset.symbol}</TableCell>
                      <TableCell align="right">
                        {asset.amount.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${asset.price.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        ${asset.value.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        {((asset.value / portfolio.totalValue) * 100).toFixed(2)}%
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: asset.change24h >= 0 
                            ? 'success.main' 
                            : 'error.main' 
                        }}
                      >
                        {asset.change24h >= 0 ? <TrendingUp /> : <TrendingDown />}
                        {asset.change24h.toFixed(2)}%
                      </TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: asset.pnl >= 0 
                            ? 'success.main' 
                            : 'error.main' 
                        }}
                      >
                        ${asset.pnl.toLocaleString()} 
                        ({asset.pnlPercent.toFixed(2)}%)
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {activeTab === 1 && (
            <TransactionHistory 
              transactions={transactions}
              loading={portfolioLoading}
            />
          )}
          {activeTab === 2 && (
            <PerformanceMetrics 
              metrics={performanceMetrics}
              loading={portfolioLoading}
            />
          )}
          {activeTab === 3 && (
            <PnLAnalysis 
              data={portfolio}
              timeRange={timeRange}
              loading={portfolioLoading}
            />
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default Portfolio; 