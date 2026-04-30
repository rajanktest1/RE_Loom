import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { RabbitMQClient } from '@realestate/rabbitmq-client';
import { leadRoutes } from './routes/lead.routes';
import { bookingRoutes } from './routes/booking.routes';
import { paymentRoutes } from './routes/payment.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.CRM_SERVICE_PORT || 4004;
const logger = createLogger('crm-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/crm/leads', leadRoutes);
app.use('/crm/bookings', bookingRoutes);
app.use('/crm/payments', paymentRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'crm-service', status: 'healthy' } });
});

app.use(errorHandler);

let rabbitmq: RabbitMQClient;

async function start() {
  try {
    const mongoUri = process.env.MONGO_CRM_URI || 'mongodb://localhost:27017/realestate_crm';
    await createConnection({ uri: mongoUri, serviceName: 'crm-service' });

    rabbitmq = new RabbitMQClient({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    });
    await rabbitmq.connect();

    // Subscribe to inventory events
    await rabbitmq.subscribe(
      'crm.inventory-events',
      ['unit.sold', 'unit.soft_locked', 'unit.lock_expired'],
      async (msg, routingKey) => {
        logger.info(`Received event: ${routingKey}`, { payload: msg });
        // TODO: Implement handlers in Phase 4
      }
    );

    app.listen(PORT, () => {
      logger.info(`CRM service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start CRM service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export { rabbitmq };
export default app;
