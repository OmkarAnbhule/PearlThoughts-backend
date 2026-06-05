import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppLoggerService } from '../logger';
import { ApiErrorResponse } from './error-response.interface';

interface ResolvedError {
  statusCode: number;
  message: string | string[];
  error: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger: ReturnType<AppLoggerService['forContext']>;

  constructor(private readonly appLogger: AppLoggerService) {
    this.logger = this.appLogger.forContext(GlobalExceptionFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const resolved = this.resolveException(exception);
    const body: ApiErrorResponse = {
      statusCode: resolved.statusCode,
      message: resolved.message,
      error: resolved.error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (resolved.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(resolved.message, {
        path: request.url,
        method: request.method,
        statusCode: resolved.statusCode,
        ...(this.isProduction() ? {} : { exception }),
      });
    }

    response.status(resolved.statusCode).json(body);
  }

  private resolveException(exception: unknown): ResolvedError {
    if (exception instanceof HttpException) {
      return this.fromHttpException(exception);
    }

    if (exception instanceof QueryFailedError) {
      return this.fromQueryFailedError(exception);
    }

    return this.fromUnknownError(exception);
  }

  private fromHttpException(exception: HttpException): ResolvedError {
    const statusCode = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        statusCode,
        message: exceptionResponse,
        error: HttpStatus[statusCode] ?? 'Error',
      };
    }

    const response = exceptionResponse as Record<string, unknown>;
    const message = this.normalizeMessage(response.message, exception.message);
    const error =
      typeof response.error === 'string'
        ? response.error
        : (HttpStatus[statusCode] ?? 'Error');

    return { statusCode, message, error };
  }

  private fromQueryFailedError(exception: QueryFailedError): ResolvedError {
    const driverError = exception.driverError as { code?: string } | undefined;

    if (driverError?.code === '23505') {
      return {
        statusCode: HttpStatus.CONFLICT,
        message: 'Resource already exists',
        error: 'Conflict',
      };
    }

    if (driverError?.code === '23503') {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Related resource does not exist',
        error: 'Bad Request',
      };
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: this.isProduction()
        ? 'Database request failed'
        : exception.message,
      error: 'Bad Request',
    };
  }

  private fromUnknownError(exception: unknown): ResolvedError {
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.isProduction()
        ? 'Internal server error'
        : this.extractErrorMessage(exception),
      error: 'Internal Server Error',
    };
  }

  private normalizeMessage(
    value: unknown,
    fallback: string,
  ): string | string[] {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      return value;
    }
    return fallback;
  }

  private extractErrorMessage(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.message;
    }
    return 'Internal server error';
  }

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
