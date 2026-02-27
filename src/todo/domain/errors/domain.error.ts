// src/todo/domain/errors/domain.error.ts

/**
 * 모든 도메인 에러의 기본 클래스
 *
 * 이 클래스는 도메인 계층에서 발생하는 모든 에러의 공통 베이스입니다.
 * 비즈니스 규칙 위반, 유효성 검증 실패, 도메인 불변 조건(invariant) 위반 등
 * 도메인에서 의미 있는 모든 예외 상황을 표현합니다.
 *
 * NestJS의 HttpException과는 완전히 독립적입니다.
 * HTTP 상태 코드 매핑은 Presentation Layer의 ExceptionFilter에서 처리합니다.
 */
export abstract class DomainError extends Error {
  /**
   * 에러의 고유 코드
   *
   * 클라이언트가 에러를 프로그래밍적으로 구분할 수 있도록 합니다.
   * 예: 'TODO_NOT_FOUND', 'INVALID_TODO_TITLE', 'INVALID_STATUS_TRANSITION'
   */
  public readonly code: string;

  /**
   * 에러 발생 시각
   *
   * 디버깅과 로깅에 활용합니다.
   */
  public readonly timestamp: Date;

  constructor(message: string, code: string) {
    super(message);

    // JavaScript에서 Error를 상속할 때 필수적인 처리
    // 이 줄이 없으면 instanceof 체크가 정상 동작하지 않을 수 있습니다
    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.code = code;
    this.timestamp = new Date();
  }

  /**
   * 에러를 직렬화 가능한 객체로 변환합니다.
   * 로깅이나 API 응답에 활용합니다.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
