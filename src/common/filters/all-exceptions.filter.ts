import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch() // Empty @Catch() means catch EVERY type of error!
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // 1. Determine HTTP status code (e.g. 400, 404, or 500 server crash)
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // 2. Extract the clean error message
        let message: string | object = 'Internal server error';
        if (exception instanceof HttpException) {
            const res = exception.getResponse();
            message = typeof res === 'object' && (res as any).message
                ? (res as any).message
                : res;
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // 3. Log the error in the server console for debugging
        this.logger.error(
            `❌ [${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(message)}`,
        );

        // 4. Send the beautifully formatted error response to the client
        response.status(status).json({
            success: false,
            statusCode: status,
            message: message,
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
}
