import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { DomainError } from '../../todo/domain/errors/domain.error';
import { TodoNotFoundError } from '../../todo/domain/errors/todo-not-found.error';
import { InvalidTodoTitleError } from '../../todo/domain/errors/invalid-todo-title.error';
import { InvalidStatusTransitionError } from '../../todo/domain/errors/invalid-status-transition.error';

/**
 * 도메인 에러 → HTTP 상태 코드 매핑
 *
 * 에러 클래스를 키로, HTTP 상태 코드를 값으로 가지는 맵입니다.
 * 새로운 도메인 에러가 추가되면 여기에 매핑을 추가합니다.
 */
const DOMAIN_ERROR_STATUS_MAP = new Map<
  new (...args: any[]) => DomainError,
  HttpStatus
>([
  [TodoNotFoundError, HttpStatus.NOT_FOUND], // 404
  [InvalidTodoTitleError, HttpStatus.BAD_REQUEST], // 400
  [InvalidStatusTransitionError, HttpStatus.CONFLICT], // 409
]);

/**
 * 도메인 예외를 HTTP 응답으로 변환하는 글로벌 필터
 *
 * @Catch(DomainError)로 DomainError 및 그 하위 클래스만 처리합니다.
 * NestJS의 기본 예외 필터는 HttpException만 처리하므로,
 * 도메인 에러를 위한 별도 필터가 필요합니다.
 *
 * 사용법:
 * ```typescript
 * // main.ts에서 글로벌 필터로 등록
 * app.useGlobalFilters(new DomainExceptionFilter());
 * ```
 *
 * 동작 흐름:
 * 1. Controller → Service → UseCase에서 DomainError가 throw됨
 * 2. NestJS가 이 필터를 호출
 * 3. 필터가 에러 클래스에 따라 HTTP 상태 코드를 결정
 * 4. JSON 형식의 에러 응답을 반환
 */
@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  /**
   * 도메인 에러를 HTTP 응답으로 변환합니다.
   *
   * @param exception - 발생한 도메인 에러
   * @param host - NestJS 실행 컨텍스트
   */
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // 에러 클래스에 따른 HTTP 상태 코드 결정
    const status = this.getHttpStatus(exception);

    // 에러 로깅
    this.logger.warn(
      `[${exception.code}] ${exception.message} | ` +
        `${request.method} ${request.url}`,
    );

    // HTTP 에러 응답 반환
    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
      timestamp: exception.timestamp.toISOString(),
      path: request.url,
    });
  }

  /**
   * 도메인 에러 클래스에 따른 HTTP 상태 코드를 반환합니다.
   *
   * DOMAIN_ERROR_STATUS_MAP에 등록되지 않은 에러는
   * 기본적으로 400 Bad Request를 반환합니다.
   *
   * @param exception - 도메인 에러 인스턴스
   * @returns HTTP 상태 코드
   */
  private getHttpStatus(exception: DomainError): HttpStatus {
    for (const [ErrorClass, status] of DOMAIN_ERROR_STATUS_MAP) {
      if (exception instanceof ErrorClass) {
        return status;
      }
    }

    // 매핑되지 않은 DomainError는 400으로 처리
    return HttpStatus.BAD_REQUEST;
  }
}
