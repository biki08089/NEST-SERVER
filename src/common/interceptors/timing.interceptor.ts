import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class TimingInterceptor implements NestInterceptor {
    private readonly logger = new Logger('Performance');

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        // 1. Get the HTTP request info (e.g. GET /courses)
        const request = context.switchToHttp().getRequest();
        const { method, originalUrl } = request;

        // 2. ⏱️ Click "START" on our stopwatch
        const startTime = Date.now();

        // 3. Let the controller run, and tap() when it completes
        return next.handle().pipe(
            tap(() => {
                // ⏱️ Click "STOP" on our stopwatch
                const duration = Date.now() - startTime;
                this.logger.log(`⚡ ${method} ${originalUrl} completed in +${duration}ms`);
            }),
        );
    }
}
