import { SetMetadata } from '@nestjs/common';

export const THROTTLE_KEY = 'throttle';

export interface ThrottleOptions {
    limit: number; // Maximum number of requests allowed
    ttl: number;   // Time window in seconds (e.g. 60)
}

// Allows you to write: @Throttle({ limit: 5, ttl: 60 }) on any route
export const Throttle = (options: ThrottleOptions) =>
    SetMetadata(THROTTLE_KEY, options);
