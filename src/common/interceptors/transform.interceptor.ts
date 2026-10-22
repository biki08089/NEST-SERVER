import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// This is the shape of our standardized response
export interface ApiResponse<T> {
    success: boolean;
    statusCode: number;
    data: T;
    timestamp: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        // 1. Get the HTTP response object to find the status code (e.g. 200, 201)
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // 2. Call the controller, then transform what comes out!
        return next.handle().pipe(
            map((data) => ({
                success: true,
                statusCode: statusCode,
                data: data,
                timestamp: new Date().toISOString(),
            })),
        );
    }
}
