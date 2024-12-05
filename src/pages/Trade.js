import React, { useState, useEffect, useMemo } from 'react';
import { Grid, Card, Box, Tabs, Tab, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useParams, useNavigate } from 'react-router-dom';

import { useMarketData } from '../hooks/useMarketData';
import { useTrade } from '../hooks/useTrade';
import { useOrderbook } from '../hooks/useOrderbook';
import { useChart } from '../hooks/useChart';
import { useSettings } from '../hooks/useSettings';

import TradingChart from '../components/chart/TradingChart';
import OrderBook from '../components/trade/OrderBook';
import TradeForm from '../components/trade/TradeForm';
import MarketTrades from '../components/trade/MarketTrades';
import OpenOrders from '../components/trade/OpenOrders';
import OpenPositions from '../components/trade/OpenPositions';
import TradeHistory from '../components/trade/TradeHistory';
import MarketInfo from '../components/market/MarketInfo';
import AlertsPanel from '../components/alerts/AlertsPanel';

const Trade = () => {
  const theme = useTheme();
  const { symbol = 'BTC/USDT' } = useParams();
  const navigate = useNavigate();
  
  // Custom hooks
  const { marketData, loading: marketLoading } = useMarketData(symbol);
  const { orderbook, loading: orderbookLoading } = useOrderbook(symbol);
  const { chartData, indicators, loading: chartLoading } = useChart(symbol);
  const { settings } = useSettings();
  const { 
    openOrders,
    openPositions,
    tradeHistory,
    placeOrder,
    cancelOrder,
    closePosition,
    loading: tradeLoading 
  } = useTrade(symbol);

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [orderType, setOrderType] = useState('limit');
  const [tradeMode, setTradeMode] = useState('spot');
  const [leverage, setLeverage] = useState(1);
  const [chartLayout, setChartLayout] = useState(settings.chartLayout || 'default');

  // Market bilgileri
  const marketInfo = useMemo(() => {
    if (!marketData) return null;
    
    return {
      price: marketData.price,
      change24h: marketData.priceChange,
      high24h: marketData.high24h,
      low24h: marketData.low24h,
      volume24h: marketData.volume,
      quoteVolume24h: marketData.quoteVolume
    };
  }, [marketData]);

  // Tab değişimi
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Market değişimi
  const handleMarketChange = (newSymbol) => {
    navigate(`/trade/${newSymbol}`);
  };

  // Order işlemleri
  const handleOrderSubmit = async (orderData) => {
    try {
      await placeOrder({
        symbol,
        type: orderType,
        mode: tradeMode,
        leverage,
        ...orderData
      });
    } catch (error) {
      console.error('Order hatası:', error);
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Grid container spacing={2}>
        {/* Sol Panel - Chart ve Market Bilgileri */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 2 }}>
            <MarketInfo 
              data={marketInfo}
              loading={marketLoading}
            />
          </Card>
          <Card>
            <TradingChart 
              data={chartData}
              indicators={indicators}
              layout={chartLayout}
              loading={chartLoading}
              onLayoutChange={setChartLayout}
            />
          </Card>
        </Grid>

        {/* Sağ Panel - Trade Formu ve OrderBook */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ mb: 2 }}>
            <TradeForm
              marketData={marketData}
              orderType={orderType}
              tradeMode={tradeMode}
              leverage={leverage}
              onOrderTypeChange={setOrderType}
              onTradeModeChange={setTradeMode}
              onLeverageChange={setLeverage}
              onSubmit={handleOrderSubmit}
              loading={tradeLoading}
            />
          </Card>
          <Card>
            <OrderBook 
              data={orderbook}
              loading={orderbookLoading}
            />
          </Card>
        </Grid>

        {/* Alt Panel - İşlemler ve Pozisyonlar */}
        <Grid item xs={12}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Açık Emirler" />
                <Tab label="Açık Pozisyonlar" />
                <Tab label="İşlem Geçmişi" />
                <Tab label="Piyasa İşlemleri" />
                <Tab label="Alarmlar" />
              </Tabs>
            </Box>
            <Box sx={{ p: 2 }}>
              {activeTab === 0 && (
                <OpenOrders 
                  orders={openOrders}
                  onCancel={cancelOrder}
                  loading={tradeLoading}
                />
              )}
              {activeTab === 1 && (
                <OpenPositions 
                  positions={openPositions}
                  onClose={closePosition}
                  loading={tradeLoading}
                />
              )}
              {activeTab === 2 && (
                <TradeHistory 
                  trades={tradeHistory}
                  loading={tradeLoading}
                />
              )}
              {activeTab === 3 && (
                <MarketTrades 
                  symbol={symbol}
                  loading={marketLoading}
                />
              )}
              {activeTab === 4 && (
                <AlertsPanel 
                  symbol={symbol}
                />
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Trade; 