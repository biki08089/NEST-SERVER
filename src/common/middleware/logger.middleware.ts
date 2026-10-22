import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
    private logger = new Logger('HTTP');

    use(req: Request, res: Response, next: NextFunction) {
        // 1. Get information from the incoming request
        const { method, originalUrl, ip } = req;

        // 2. Print a friendly log message
        this.logger.log(`Incoming Request: ${method} ${originalUrl} - IP: ${ip}`);

        // 3. Very important: Allow the request to continue to the controller!
        next();
    }
}
