import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from '@realestate/shared-utils';
import { authMiddleware } from './middleware/auth.middleware';
import { rateLimiter } from './middleware/rate-limiter.middleware';
import { proxyRoutes } from './routes/proxy.routes';
import { healthRoute } from './routes/health.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.GATEWAY_PORT || 4000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(morgan('combined'));

// Rate limiting
app.use('/api', rateLimiter);

// Health check (no auth required)
app.use('/health', healthRoute);

// Auth middleware for all /api routes (except auth endpoints)
// NOTE: Do NOT use express.json() before proxy routes — it consumes the request body
app.use('/api/auth', proxyRoutes.auth);
app.use('/api', authMiddleware, proxyRoutes.protected);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Gateway] Running on port ${PORT}`);
});

export default app;
