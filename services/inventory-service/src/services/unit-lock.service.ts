import Redis from 'ioredis';
import { Server as SocketIOServer } from 'socket.io';
import { Unit } from '../models/unit.model';
import { UnitStatus } from '@realestate/shared-types';
import { createLogger } from '@realestate/shared-utils';

const logger = createLogger('unit-lock-service');

const DEFAULT_LOCK_DURATION = 20 * 60; // 20 minutes in seconds
const LOCK_KEY_PREFIX = 'unit:lock:';

export class UnitLockService {
  private redis: Redis;
  private io: SocketIOServer | null = null;

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
    this.redis.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }

  setSocketIO(io: SocketIOServer) {
    this.io = io;
  }

  /**
   * Acquire a soft-lock on a unit via Redis TTL key
   * Returns true if lock acquired, false if already locked
   */
  async acquireLock(unitId: string, userId: string, durationSeconds = DEFAULT_LOCK_DURATION): Promise<{
    success: boolean;
    lockExpiresAt?: Date;
    lockedBy?: string;
    message: string;
  }> {
    const lockKey = `${LOCK_KEY_PREFIX}${unitId}`;

    // Check if unit is already locked by checking Redis first (fast path)
    const existingLock = await this.redis.get(lockKey);
    if (existingLock) {
      const lockData = JSON.parse(existingLock);
      if (lockData.userId === userId) {
        // Same user re-locking — extend the lock
        await this.redis.setex(lockKey, durationSeconds, JSON.stringify({ userId, lockedAt: lockData.lockedAt }));
        const lockExpiresAt = new Date(Date.now() + durationSeconds * 1000);
        return { success: true, lockExpiresAt, lockedBy: userId, message: 'Lock extended' };
      }
      const ttl = await this.redis.ttl(lockKey);
      return {
        success: false,
        lockedBy: lockData.userId,
        lockExpiresAt: new Date(Date.now() + ttl * 1000),
        message: `Unit is locked by another user (expires in ${ttl}s)`,
      };
    }

    // Atomic lock acquisition using SET NX EX (only sets if not exists)
    const lockData = JSON.stringify({ userId, lockedAt: new Date().toISOString() });
    const acquired = await this.redis.set(lockKey, lockData, 'EX', durationSeconds, 'NX');

    if (!acquired) {
      // Race condition: someone locked it between our GET and SET
      const data = await this.redis.get(lockKey);
      if (data) {
        const parsed = JSON.parse(data);
        return { success: false, lockedBy: parsed.userId, message: 'Unit was just locked by another user' };
      }
      return { success: false, message: 'Failed to acquire lock (try again)' };
    }

    // Update MongoDB unit status
    const lockExpiresAt = new Date(Date.now() + durationSeconds * 1000);
    await Unit.findByIdAndUpdate(unitId, {
      status: UnitStatus.SOFT_LOCKED,
      lockedBy: userId,
      lockExpiresAt,
    });

    // Broadcast via Socket.io
    this.broadcastLockChange(unitId, 'locked', userId, lockExpiresAt);

    logger.info(`Unit ${unitId} locked by ${userId} for ${durationSeconds}s`);
    return { success: true, lockExpiresAt, lockedBy: userId, message: `Unit locked for ${Math.round(durationSeconds / 60)} minutes` };
  }

  /**
   * Release a soft-lock
   */
  async releaseLock(unitId: string, userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const lockKey = `${LOCK_KEY_PREFIX}${unitId}`;

    const existingLock = await this.redis.get(lockKey);
    if (!existingLock) {
      // Lock already expired or doesn't exist - ensure MongoDB is consistent
      await Unit.findByIdAndUpdate(unitId, {
        status: UnitStatus.AVAILABLE,
        lockedBy: undefined,
        lockExpiresAt: undefined,
      });
      return { success: true, message: 'Lock already expired' };
    }

    const lockData = JSON.parse(existingLock);
    if (lockData.userId !== userId) {
      return { success: false, message: 'You do not own this lock' };
    }

    await this.redis.del(lockKey);

    // Update MongoDB
    await Unit.findByIdAndUpdate(unitId, {
      status: UnitStatus.AVAILABLE,
      lockedBy: undefined,
      lockExpiresAt: undefined,
    });

    // Broadcast via Socket.io
    this.broadcastLockChange(unitId, 'unlocked', userId);

    logger.info(`Unit ${unitId} unlocked by ${userId}`);
    return { success: true, message: 'Unit unlocked' };
  }

  /**
   * Get lock status for a unit
   */
  async getLockStatus(unitId: string): Promise<{
    isLocked: boolean;
    lockedBy?: string;
    expiresIn?: number;
  }> {
    const lockKey = `${LOCK_KEY_PREFIX}${unitId}`;
    const data = await this.redis.get(lockKey);

    if (!data) {
      return { isLocked: false };
    }

    const parsed = JSON.parse(data);
    const ttl = await this.redis.ttl(lockKey);
    return { isLocked: true, lockedBy: parsed.userId, expiresIn: ttl };
  }

  /**
   * Get all locked units for a project (using pattern scan)
   */
  async getProjectLocks(projectId: string): Promise<Array<{
    unitId: string;
    lockedBy: string;
    expiresIn: number;
  }>> {
    // Fetch locked units from MongoDB (more reliable for project-level query)
    const lockedUnits = await Unit.find({
      projectId,
      status: UnitStatus.SOFT_LOCKED,
    }).select('_id lockedBy lockExpiresAt').lean();

    return lockedUnits.map((u) => ({
      unitId: u._id.toString(),
      lockedBy: u.lockedBy || 'unknown',
      expiresIn: u.lockExpiresAt ? Math.max(0, Math.round((u.lockExpiresAt.getTime() - Date.now()) / 1000)) : 0,
    }));
  }

  /**
   * Clean up expired locks (sync Redis TTL expirations with MongoDB)
   * Run periodically (every 5 minutes)
   */
  async cleanupExpiredLocks(): Promise<number> {
    const expiredUnits = await Unit.find({
      status: UnitStatus.SOFT_LOCKED,
      lockExpiresAt: { $lt: new Date() },
    });

    let cleaned = 0;
    for (const unit of expiredUnits) {
      unit.status = UnitStatus.AVAILABLE;
      unit.lockedBy = undefined;
      unit.lockExpiresAt = undefined;
      await unit.save();
      this.broadcastLockChange(unit._id.toString(), 'expired', unit.lockedBy || '');
      cleaned++;
    }

    if (cleaned > 0) {
      logger.info(`Cleaned up ${cleaned} expired locks`);
    }
    return cleaned;
  }

  private broadcastLockChange(unitId: string, action: 'locked' | 'unlocked' | 'expired', userId: string, expiresAt?: Date) {
    if (!this.io) return;

    this.io.emit('unit:lock-change', {
      unitId,
      action,
      userId,
      expiresAt: expiresAt?.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
