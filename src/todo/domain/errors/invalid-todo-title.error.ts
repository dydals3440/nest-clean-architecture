// src/todo/domain/errors/invalid-todo-title.error.ts

import { DomainError } from './domain.error';

/**
 * Todo 제목이 비즈니스 규칙을 위반할 때 발생하는 에러
 *
 * 다음과 같은 경우에 발생합니다:
 * - 제목이 빈 문자열이거나 공백만 포함하는 경우
 * - 제목이 최소 길이(1자)보다 짧은 경우
 * - 제목이 최대 길이(100자)를 초과하는 경우
 *
 * Presentation Layer에서 HTTP 400 Bad Request로 매핑됩니다.
 */
export class InvalidTodoTitleError extends DomainError {
  /**
   * 유효성 검증에 실패한 실제 제목 값
   * 어떤 값이 왜 거부되었는지 확인할 수 있습니다.
   */
  public readonly invalidTitle: string;

  /**
   * 구체적인 위반 사유
   * 클라이언트에게 어떤 규칙을 위반했는지 알려줍니다.
   */
  public readonly reason: string;

  constructor(title: string, reason: string) {
    super(`유효하지 않은 Todo 제목입니다: ${reason}`, 'INVALID_TODO_TITLE');
    this.invalidTitle = title;
    this.reason = reason;
  }

  /**
   * 빈 제목에 대한 팩토리 메서드
   *
   * 자주 발생하는 케이스를 팩토리 메서드로 제공하여
   * 호출부의 코드를 간결하게 만듭니다.
   */
  static empty(): InvalidTodoTitleError {
    return new InvalidTodoTitleError('', '제목은 비어있을 수 없습니다.');
  }

  /**
   * 최대 길이 초과에 대한 팩토리 메서드
   */
  static tooLong(title: string, maxLength: number): InvalidTodoTitleError {
    return new InvalidTodoTitleError(
      title,
      `제목은 ${maxLength}자를 초과할 수 없습니다. (현재: ${title.length}자)`,
    );
  }

  /**
   * 최소 길이 미만에 대한 팩토리 메서드
   */
  static tooShort(title: string, minLength: number): InvalidTodoTitleError {
    return new InvalidTodoTitleError(
      title,
      `제목은 최소 ${minLength}자 이상이어야 합니다. (현재: ${title.length}자)`,
    );
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      invalidTitle: this.invalidTitle,
      reason: this.reason,
    };
  }
}
