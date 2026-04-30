import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { RabbitMQClient } from '@realestate/rabbitmq-client';
import { vendorRoutes } from './routes/vendor.routes';
import { purchaseOrderRoutes } from './routes/purchase-order.routes';
import { milestoneRoutes } from './routes/milestone.routes';
import { qcRoutes } from './routes/qc.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.SUPPLY_CHAIN_SERVICE_PORT || 4003;
const logger = createLogger('supply-chain-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/supply-chain/vendors', vendorRoutes);
app.use('/supply-chain/purchase-orders', purchaseOrderRoutes);
app.use('/supply-chain/milestones', milestoneRoutes);
app.use('/supply-chain/qc', qcRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'supply-chain-service', status: 'healthy' } });
});

app.use(errorHandler);

let rabbitmq: RabbitMQClient;

async function start() {
  try {
    const mongoUri = process.env.MONGO_SUPPLY_CHAIN_URI || 'mongodb://localhost:27017/realestate_supply_chain';
    await createConnection({ uri: mongoUri, serviceName: 'supply-chain-service' });

    rabbitmq = new RabbitMQClient({
      url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    });
    await rabbitmq.connect();

    app.listen(PORT, () => {
      logger.info(`Supply Chain service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start supply-chain service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export { rabbitmq };
export default app;
