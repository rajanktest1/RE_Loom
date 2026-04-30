import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { authRoutes } from './routes/auth.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4001;
const logger = createLogger('auth-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'auth-service', status: 'healthy' } });
});

// Error handler
app.use(errorHandler);

async function start() {
  try {
    const mongoUri = process.env.MONGO_AUTH_URI || 'mongodb://localhost:27017/realestate_auth';
    await createConnection({ uri: mongoUri, serviceName: 'auth-service' });

    app.listen(PORT, () => {
      logger.info(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start auth service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
