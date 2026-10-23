import {
    Injectable,
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service.js';
import { THROTTLE_KEY, ThrottleOptions } from '../decorators/throttle.decorator.js';

@Injectable()
export class RateLimitGuard implements CanActivate {
    private readonly logger = new Logger('RateLimitGuard');

    // Inject both Reflector (to read @Throttle) and RedisService (to talk to Redis)
    constructor(
        private readonly reflector: Reflector,
        private readonly redis: RedisService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // 1. Read the @Throttle sticky note on this route
        const options = this.reflector.getAllAndOverride<ThrottleOptions>(
            THROTTLE_KEY,
            [context.getHandler(), context.getClass()],
        );

        // If there is no @Throttle note on this route, allow everyone through!
        if (!options) {
            return true;
        }

        // 2. Get the incoming HTTP request and client IP
        const request = context.switchToHttp().getRequest();
        const ip = request.ip || '127.0.0.1';
        const route = request.route?.path || request.url;

        // 3. Create a unique Redis key for this IP and route
        // e.g., "rate_limit:::1:/auth/login"
        const key = `rate_limit:${ip}:${route}`;

        // 4. Increment the counter in Redis
        const currentHits = await this.redis.incr(key, options.ttl);

        // 5. If hits exceed the limit, BLOCK THEM! 🛑
        if (currentHits > options.limit) {
            this.logger.warn(`⚠️ Rate limit exceeded for IP: ${ip} on ${route}`);

            throw new HttpException(
                `Too many requests from your IP. Maximum ${options.limit} allowed per ${options.ttl} seconds.`,
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        // 6. Access granted!
        return true;
    }
}
