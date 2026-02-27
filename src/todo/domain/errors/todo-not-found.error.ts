// src/todo/domain/errors/todo-not-found.error.ts

import { DomainError } from './domain.error';

/**
 * Todo 엔티티를 찾을 수 없을 때 발생하는 에러
 *
 * Use Case에서 특정 ID의 Todo를 조회했지만 존재하지 않는 경우 사용합니다.
 * Presentation Layer에서 HTTP 404 Not Found로 매핑됩니다.
 *
 * @example
 * ```typescript
 * const todo = await this.todoRepository.findById(id);
 * if (!todo) {
 *   throw new TodoNotFoundError(id);
 * }
 * ```
 */
export class TodoNotFoundError extends DomainError {
  /**
   * 찾을 수 없었던 Todo의 ID
   * 디버깅 시 어떤 ID가 문제인지 바로 확인할 수 있습니다.
   */
  public readonly todoId: number;

  constructor(id: number) {
    super(`ID가 ${id}인 Todo를 찾을 수 없습니다.`, 'TODO_NOT_FOUND');
    this.todoId = id;
  }

  /**
   * 직렬화 시 todoId도 포함합니다.
   */
  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      todoId: this.todoId,
    };
  }
}
