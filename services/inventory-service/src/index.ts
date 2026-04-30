import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { RabbitMQClient } from '@realestate/rabbitmq-client';
import { projectRoutes } from './routes/project.routes';
import { unitRoutes } from './routes/unit.routes';
import { blockRoutes } from './routes/block.routes';
import { pricingRoutes } from './routes/pricing.routes';
import { UnitLockService } from './services/unit-lock.service';

dotenv.config({ path: '../../.env' });

const app = express();
const server = http.createServer(app);
const PORT = process.env.INVENTORY_SERVICE_PORT || 4002;
const logger = createLogger('inventory-service');

// Socket.io for real-time lock broadcasts
const io = new SocketIOServer(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Redis-based unit lock service
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const unitLockService = new UnitLockService(redisUrl);
unitLockService.setSocketIO(io);

app.use(helmet());
app.use(cors());
app.use(express.json());

// Make lock service available to routes
app.set('unitLockService', unitLockService);

// Routes
app.use('/inventory/projects', projectRoutes);
app.use('/inventory/blocks', blockRoutes);
app.use('/inventory/units', unitRoutes);
app.use('/inventory/pricing', pricingRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'inventory-service', status: 'healthy' } });
});

app.use(errorHandler);

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe:project', (projectId: string) => {
    socket.join(`project:${projectId}`);
    logger.info(`Client ${socket.id} subscribed to project ${projectId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

async function start() {
  try {
    const mongoUri = process.env.MONGO_INVENTORY_URI || 'mongodb://localhost:27017/realestate_inventory';
    await createConnection({ uri: mongoUri, serviceName: 'inventory-service' });

    // Connect RabbitMQ
    const rabbitmq = new RabbitMQClient({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    });
    await rabbitmq.connect();

    // Subscribe to supply-chain events
    await rabbitmq.subscribe(
      'inventory.supply-chain-events',
      ['milestone.completed', 'qc.passed'],
      async (msg, routingKey) => {
        logger.info(`Received event: ${routingKey}`, { payload: msg });
      }
    );

    // Periodic cleanup of expired locks (every 5 minutes)
    setInterval(async () => {
      try {
        await unitLockService.cleanupExpiredLocks();
      } catch (err) {
        logger.error('Lock cleanup failed', { error: (err as Error).message });
      }
    }, 5 * 60 * 1000);

    server.listen(PORT, () => {
      logger.info(`Inventory service running on port ${PORT} (HTTP + WebSocket)`);
    });
  } catch (error) {
    logger.error('Failed to start inventory service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
