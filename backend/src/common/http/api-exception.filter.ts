import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestWithId } from './request-id.middleware';

type ErrorBody = {
  code?: string;
  message?: string | string[];
  errors?: Record<string, unknown>;
};

const STATUS_CODES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'VALIDATION_ERROR',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
};

function prismaStatus(exception: unknown): {
  statusCode: number;
  code: string;
  message: string;
} | null {
  const code =
    typeof exception === 'object' && exception !== null && 'code' in exception
      ? String(exception.code)
      : '';
  if (code === 'P2002') {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: 'DUPLICATE_RESOURCE',
      message: '记录已存在，请刷新后重试',
    };
  }
  if (code === 'P2025') {
    return {
      statusCode: HttpStatus.NOT_FOUND,
      code: 'NOT_FOUND',
      message: '没有找到要操作的记录',
    };
  }
  return null;
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithId>();
    const response = context.getResponse<Response>();
    const prismaError = prismaStatus(exception);
    const statusCode =
      prismaError?.statusCode ??
      (exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR);
    const rawBody =
      exception instanceof HttpException ? exception.getResponse() : null;
    const body: ErrorBody =
      typeof rawBody === 'object' && rawBody !== null
        ? (rawBody as ErrorBody)
        : {};
    const rawMessage =
      typeof rawBody === 'string' ? rawBody : body.message;
    const message = prismaError?.message ?? this.messageFor(statusCode, rawMessage);
    const code =
      prismaError?.code ??
      body.code ??
      STATUS_CODES[statusCode] ??
      'INTERNAL_SERVER_ERROR';

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error(
        JSON.stringify({
          event: 'request_failed',
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl,
          statusCode,
        }),
        stack,
      );
    }

    response.status(statusCode).json({
      statusCode,
      code,
      message,
      ...(body.errors ? { errors: body.errors } : {}),
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
    });
  }

  private messageFor(
    statusCode: number,
    rawMessage?: string | string[],
  ): string {
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      return '服务暂时不可用，请稍后重试';
    }
    if (Array.isArray(rawMessage)) return rawMessage.join('；');
    if (rawMessage) return rawMessage;
    if (statusCode === HttpStatus.UNPROCESSABLE_ENTITY) {
      return '填写内容不符合要求，请检查后重试';
    }
    return '请求未完成，请稍后重试';
  }
}
