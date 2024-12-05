import { rest } from 'msw';

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

export const handlers = [
  // Coin listesi
  rest.get(`${BASE_URL}/coins/list`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum' }
      ])
    );
  }),

  // Coin detayı
  rest.get(`${BASE_URL}/coins/:id`, (req, res, ctx) => {
    const { id } = req.params;
    return res(
      ctx.status(200),
      ctx.json({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        symbol: id.substring(0, 3),
        market_data: {
          current_price: { usd: 50000 },
          market_cap: { usd: 1000000000 }
        }
      })
    );
  }),

  // Portfolyo işlemleri
  rest.get(`${BASE_URL}/portfolio`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        { id: 1, coin: 'bitcoin', amount: 1.5, price: 45000 },
        { id: 2, coin: 'ethereum', amount: 10, price: 3000 }
      ])
    );
  }),

  // Kullanıcı işlemleri
  rest.post(`${BASE_URL}/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: 'mock-jwt-token',
        user: { id: 1, name: 'Test User', email: 'test@example.com' }
      })
    );
  })
]; 