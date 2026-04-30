import amqp from 'amqplib';

export interface RabbitMQConfig {
  url: string;
  exchange?: string;
  exchangeType?: 'topic' | 'direct' | 'fanout';
  retryAttempts?: number;
  retryDelay?: number;
}

export type MessageHandler = (msg: unknown, routingKey: string) => Promise<void>;

const DEFAULT_EXCHANGE = 'realestate.events';
const DEFAULT_EXCHANGE_TYPE = 'topic';

export class RabbitMQClient {
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private config: Required<RabbitMQConfig>;
  private isConnected = false;

  constructor(config: RabbitMQConfig) {
    this.config = {
      url: config.url,
      exchange: config.exchange || DEFAULT_EXCHANGE,
      exchangeType: config.exchangeType || DEFAULT_EXCHANGE_TYPE,
      retryAttempts: config.retryAttempts || 5,
      retryDelay: config.retryDelay || 5000,
    };
  }

  async connect(): Promise<void> {
    let attempts = 0;

    while (attempts < this.config.retryAttempts) {
      try {
        this.connection = await amqp.connect(this.config.url);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(
          this.config.exchange,
          this.config.exchangeType,
          { durable: true }
        );

        this.isConnected = true;

        this.connection.on('close', () => {
          this.isConnected = false;
          console.log('[RabbitMQ] Connection closed. Reconnecting...');
          setTimeout(() => this.connect(), this.config.retryDelay);
        });

        this.connection.on('error', (err: Error) => {
          console.error('[RabbitMQ] Connection error:', err.message);
        });

        console.log('[RabbitMQ] Connected successfully');
        return;
      } catch (error) {
        attempts++;
        console.error(
          `[RabbitMQ] Connection attempt ${attempts}/${this.config.retryAttempts} failed:`,
          (error as Error).message
        );

        if (attempts >= this.config.retryAttempts) {
          throw new Error(
            `[RabbitMQ] Failed to connect after ${this.config.retryAttempts} attempts`
          );
        }

        await new Promise((resolve) => setTimeout(resolve, this.config.retryDelay));
      }
    }
  }

  async publish(routingKey: string, message: unknown): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('[RabbitMQ] Not connected. Call connect() first.');
    }

    const content = Buffer.from(JSON.stringify(message));

    this.channel.publish(this.config.exchange, routingKey, content, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now(),
    });
  }

  async subscribe(
    queueName: string,
    routingKeys: string[],
    handler: MessageHandler
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      throw new Error('[RabbitMQ] Not connected. Call connect() first.');
    }

    await this.channel.assertQueue(queueName, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': `${this.config.exchange}.dlx`,
      },
    });

    for (const key of routingKeys) {
      await this.channel.bindQueue(queueName, this.config.exchange, key);
    }

    await this.channel.prefetch(10);

    await this.channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content, msg.fields.routingKey);
        this.channel!.ack(msg);
      } catch (error) {
        console.error('[RabbitMQ] Message processing error:', (error as Error).message);
        this.channel!.nack(msg, false, false);
      }
    });

    console.log(`[RabbitMQ] Subscribed to queue: ${queueName}, keys: ${routingKeys.join(', ')}`);
  }

  async close(): Promise<void> {
    if (this.channel) await this.channel.close();
    if (this.connection) await this.connection.close();
    this.isConnected = false;
    console.log('[RabbitMQ] Connection closed');
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}
