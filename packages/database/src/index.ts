import mongoose, { Connection } from 'mongoose';

export interface DatabaseConfig {
  uri: string;
  serviceName: string;
}

export async function createConnection(config: DatabaseConfig): Promise<typeof mongoose> {
  const { uri, serviceName } = config;

  try {
    await mongoose.connect(uri);

    mongoose.connection.on('error', (err) => {
      console.error(`[${serviceName}] MongoDB error:`, err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.log(`[${serviceName}] MongoDB disconnected`);
    });

    console.log(`[${serviceName}] MongoDB connected to: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
    return mongoose;
  } catch (error) {
    console.error(`[${serviceName}] Failed to connect to MongoDB:`, (error as Error).message);
    throw error;
  }
}

export async function closeConnection(_connection?: Connection): Promise<void> {
  await mongoose.disconnect();
}

export { mongoose };
