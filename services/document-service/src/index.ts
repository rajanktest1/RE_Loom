import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createConnection } from '@realestate/database';
import { errorHandler, createLogger } from '@realestate/shared-utils';
import { documentRoutes } from './routes/document.routes';

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.DOCUMENT_SERVICE_PORT || 4006;
const logger = createLogger('document-service');

app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/documents', documentRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'document-service', status: 'healthy' } });
});

app.use(errorHandler);

async function start() {
  try {
    const mongoUri = process.env.MONGO_DOCUMENT_URI || 'mongodb://localhost:27017/realestate_document';
    await createConnection({ uri: mongoUri, serviceName: 'document-service' });

    app.listen(PORT, () => {
      logger.info(`Document service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start document service', { error: (error as Error).message });
    process.exit(1);
  }
}

start();

export default app;
