import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';

type ErrorBody = {
  message: string;
  code: string;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<any>();
    const req = ctx.getRequest<any>();

    let status = 500;
    let body: ErrorBody = {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        body = {
          message: response,
          code: status === 400 ? 'BAD_REQUEST' : 'ERROR',
        };
      } else if (response && typeof response === 'object') {
        const respObj = response as any;
        const message = respObj.message ?? respObj.error ?? exception.message;
        const code =
          respObj.code ??
          (status === 400
            ? 'BAD_REQUEST'
            : status === 401
              ? 'AUTH_INVALID'
              : status === 403
                ? 'FORBIDDEN'
                : 'ERROR');

        if (Array.isArray(message)) {
          body = {
            message: 'Validation failed',
            code: 'BAD_REQUEST',
            details: message,
          };
        } else {
          body = {
            message: message || 'Request failed',
            code,
          };
        }
      }
    } else {
      const err = exception as any;
      if (err?.stack) {
        this.logger.error(err.stack);
      } else {
        this.logger.error('Unhandled exception', err);
      }
    }

    if (status >= 500) {
      this.logger.error(`HTTP ${status} ${req?.method} ${req?.url}`, (exception as any)?.stack);
    }

    res.status(status).json(body);
  }
}
