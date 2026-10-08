import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  onModuleInit() {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      this.logger.warn('⚠️ REDIS_URL not found in .env. Redis caching will be disabled.');
      return;
    }

    // Initialize Redis client using Upstash TLS URL
    this.client = new (Redis as any)(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        return Math.min(times * 100, 2000);
      },
    });

    this.client.on('connect', () => {
      this.logger.log('🚀 Successfully connected to Redis (Upstash)!');
    });

    this.client.on('error', (err) => {
      this.logger.error(`❌ Redis error: ${err.message}`);
    });
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
      this.logger.log('Redis client disconnected.');
    }
  }


  /**
* Atomic increment for Rate Limiting.
* If key does not exist, sets it to 1 and applies the TTL.
* Returns the current count.
*/
  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.client) return 0;
    try {
      const count = await this.client.incr(key);
      // Set TTL only on the first hit when counter is created
      if (count === 1 && ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
      }
      return count;
    } catch (err) {
      this.logger.error(`Error incrementing key "${key}":`, err);
      return 0;
    }
  }


  /**
   * Get parsed value from Redis.
   * If key does not exist or fails, returns null (Cache Miss).
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const data = await this.client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (err) {
      this.logger.error(`Error reading key "${key}" from Redis:`, err);
      return null;
    }
  }

  /**
   * Store any value in Redis as JSON string with an optional TTL in seconds.
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (err) {
      this.logger.error(`Error saving key "${key}" to Redis:`, err);
    }
  }

  /**
   * Delete a specific key from Redis (Cache Invalidation).
   */
  async del(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Error deleting key "${key}" from Redis:`, err);
    }
  }

  /**
   * Delete all keys matching a pattern, e.g. "courses:*"
   */
  async delByPattern(pattern: string): Promise<void> {
    if (!this.client) return;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (err) {
      this.logger.error(`Error deleting pattern "${pattern}" from Redis:`, err);
    }
  }

  /**
   * Direct access to underlying ioredis client if raw commands are needed.
   */
  getClient(): Redis {
    return this.client;
  }
}
