import { Todo } from '../entities/todo.entity';
import { TodoRepository } from '../repositories/todo.repository.interface';
import { TodoNotFoundError } from '../errors/todo-not-found.error';

/**
 * Todo 완료 상태 토글 유스케이스
 *
 * Todo의 완료 상태를 반전시킵니다:
 * - 완료 상태(COMPLETED) → 미완료(PENDING)
 * - 그 외 상태 → 완료(COMPLETED)
 *
 * 프론트엔드의 체크박스 토글에 대응하는 유스케이스입니다.
 *
 * @example
 * ```typescript
 * const useCase = new ToggleTodoUseCase(todoRepository);
 *
 * // PENDING → COMPLETED
 * const toggled = await useCase.execute(1);
 * console.log(toggled.status); // 'COMPLETED'
 *
 * // COMPLETED → PENDING
 * const toggled2 = await useCase.execute(1);
 * console.log(toggled2.status); // 'PENDING'
 * ```
 */
export class ToggleTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 완료 상태를 토글합니다.
   *
   * @param id - 토글할 Todo의 ID
   * @returns 토글된 Todo 엔티티
   * @throws TodoNotFoundError 해당 ID의 Todo가 존재하지 않는 경우
   */
  async execute(id: number): Promise<Todo> {
    // 1. 기존 Todo 조회
    const todo = await this.todoRepository.findById(id);

    if (!todo) {
      throw new TodoNotFoundError(id);
    }

    // 2. 도메인 엔티티의 toggleComplete() 메서드 호출
    //    - 완료 상태 → uncomplete() → PENDING
    //    - 그 외 → complete() → COMPLETED
    //    내부에서 상태 전이 규칙이 자동으로 적용됩니다
    todo.toggleComplete();

    // 3. 변경된 상태 저장
    const updatedTodo = await this.todoRepository.update(todo);

    return updatedTodo;
  }
}
