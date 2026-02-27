import { TodoRepository } from '../repositories/todo.repository.interface';
import { TodoNotFoundError } from '../errors/todo-not-found.error';

/**
 * Todo 삭제 유스케이스
 *
 * 존재하는 Todo를 삭제합니다.
 * 존재하지 않는 ID를 삭제하려고 하면 TodoNotFoundError를 발생시킵니다.
 *
 * 비즈니스 규칙:
 * - 삭제 전에 존재 확인이 필요합니다
 * - (필요에 따라 "완료된 Todo만 삭제 가능" 같은 규칙을 추가할 수 있습니다)
 *
 * @example
 * ```typescript
 * const useCase = new DeleteTodoUseCase(todoRepository);
 * await useCase.execute(1); // 성공: void 반환
 * await useCase.execute(999); // 실패: TodoNotFoundError 발생
 * ```
 */
export class DeleteTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 삭제를 실행합니다.
   *
   * @param id - 삭제할 Todo의 ID
   * @throws TodoNotFoundError 해당 ID의 Todo가 존재하지 않는 경우
   */
  async execute(id: number): Promise<void> {
    // 1. 존재 확인
    const existingTodo = await this.todoRepository.findById(id);

    if (!existingTodo) {
      throw new TodoNotFoundError(id);
    }

    // 2. 삭제 수행
    //    비즈니스 규칙을 추가하려면 여기에 작성합니다.
    //    예: if (existingTodo.isCompleted()) {
    //          throw new CannotDeleteCompletedTodoError(id);
    //        }
    await this.todoRepository.delete(id);
  }
}
