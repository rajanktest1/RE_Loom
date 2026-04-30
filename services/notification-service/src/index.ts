import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { RabbitMQClient } from '@realestate/rabbitmq-client';
import { EventName } from '@realestate/shared-types';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 4005;
const logger = createLogger('notification-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'notification-service', status: 'healthy' } });
});

app.use(errorHandler);

async function start() {
  try {
    const mongoUri = process.env.MONGO_NOTIFICATION_URI || 'mongodb://localhost:27017/realestate_notification';
    await createConnection({ uri: mongoUri, serviceName: 'notification-service' });

    const rabbitmq = new RabbitMQClient({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    });
    await rabbitmq.connect();

    // Subscribe to notification-relevant events
    await rabbitmq.subscribe(
      'notifications.events',
      [
        EventName.LEAD_STAGE_CHANGED,
        EventName.BOOKING_CREATED,
        EventName.PAYMENT_RECEIVED,
        EventName.PAYMENT_OVERDUE,
        EventName.LEAD_CREATED,
      ],
      async (msg, routingKey) => {
        logger.info(`Notification event received: ${routingKey}`, { payload: msg });
        // TODO: Dispatch to appropriate channel (email, whatsapp, push) — Phase 5
      }
    );

    app.listen(PORT, () => {
      logger.info(`Notification service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start notification service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
