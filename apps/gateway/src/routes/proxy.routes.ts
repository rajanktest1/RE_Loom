import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authRateLimiter } from '../middleware/rate-limiter.middleware';

const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:4001';
const INVENTORY_SERVICE = process.env.INVENTORY_SERVICE_URL || 'http://localhost:4002';
const SUPPLY_CHAIN_SERVICE = process.env.SUPPLY_CHAIN_SERVICE_URL || 'http://localhost:4003';
const CRM_SERVICE = process.env.CRM_SERVICE_URL || 'http://localhost:4004';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4005';
const DOCUMENT_SERVICE = process.env.DOCUMENT_SERVICE_URL || 'http://localhost:4006';

// Auth routes (no JWT required)
const authRouter = Router();
authRouter.use(
  authRateLimiter,
  createProxyMiddleware({
    target: AUTH_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/auth${_path}`,
  })
);

// Protected routes (JWT required — handled by gateway auth middleware)
const protectedRouter = Router();

protectedRouter.use(
  '/inventory',
  createProxyMiddleware({
    target: INVENTORY_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/inventory${_path}`,
  })
);

protectedRouter.use(
  '/supply-chain',
  createProxyMiddleware({
    target: SUPPLY_CHAIN_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/supply-chain${_path}`,
  })
);

protectedRouter.use(
  '/crm',
  createProxyMiddleware({
    target: CRM_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/crm${_path}`,
  })
);

protectedRouter.use(
  '/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/notifications${_path}`,
  })
);

protectedRouter.use(
  '/documents',
  createProxyMiddleware({
    target: DOCUMENT_SERVICE,
    changeOrigin: true,
    pathRewrite: (_path: string) => `/documents${_path}`,
  })
);

// User info endpoint (served by gateway itself from token)
protectedRouter.get('/me', (req, res) => {
  res.json({ success: true, data: req.user });
});

export const proxyRoutes = {
  auth: authRouter,
  protected: protectedRouter,
};
