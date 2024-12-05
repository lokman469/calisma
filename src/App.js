import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';
import Layout from './components/Layout';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext';
import { setupGlobalErrorHandlers } from './utils/errorHandlers';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Lazy loading ile komponentleri yükleyelim
const Header = lazy(() => import('./components/Header'));
const Home = lazy(() => import('./pages/Home'));
const CoinDetail = lazy(() => import('./pages/CoinDetail'));
const NewsAnalysis = lazy(() => import('./pages/NewsAnalysis'));
const Portfolio = lazy(() => import('./pages/Portfolio'));
const PriceAlerts = lazy(() => import('./pages/PriceAlerts'));
const TechnicalAnalysis = lazy(() => import('./pages/TechnicalAnalysis'));
const ArbitrageOpportunities = lazy(() => import('./pages/ArbitrageOpportunities'));
const SocialFeed = lazy(() => import('./pages/SocialFeed'));
const MarketDepth = lazy(() => import('./pages/MarketDepth'));
const TradeHistory = lazy(() => import('./pages/TradeHistory'));
const Reports = lazy(() => import('./pages/Reports'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));

// Loading komponenti
const LoadingScreen = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

function App() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <UserProvider>
        <ThemeProvider>
          <NotificationProvider>
            <CssBaseline />
            <ErrorBoundary>
              <Router>
                <Layout>
                  <Suspense fallback={<LoadingScreen />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/coin/:id" element={<CoinDetail />} />
                      <Route path="/news" element={<NewsAnalysis />} />
                      <Route path="/portfolio" element={<Portfolio />} />
                      <Route path="/alerts" element={<PriceAlerts />} />
                      <Route path="/technical" element={<TechnicalAnalysis />} />
                      <Route path="/arbitrage" element={<ArbitrageOpportunities />} />
                      <Route path="/social" element={<SocialFeed />} />
                      <Route path="/depth" element={<MarketDepth />} />
                      <Route path="/history" element={<TradeHistory />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                    </Routes>
                  </Suspense>
                </Layout>
              </Router>
            </ErrorBoundary>
            <ToastContainer />
          </NotificationProvider>
        </ThemeProvider>
      </UserProvider>
    </LocalizationProvider>
  );
}

export default App; 