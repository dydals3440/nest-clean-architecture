import { Todo } from '../entities/todo.entity';
import { TodoRepository } from '../repositories/todo.repository.interface';
import { TodoNotFoundError } from '../errors/todo-not-found.error';

/**
 * ID로 단일 Todo 조회 유스케이스
 *
 * 존재하지 않는 ID를 조회하면 TodoNotFoundError를 발생시킵니다.
 *
 * Repository의 findById()와의 차이:
 * - Repository.findById(): 없으면 null 반환 (단순 데이터 접근)
 * - UseCase.execute(): 없으면 에러 발생 (비즈니스 규칙 적용)
 *
 * 이 구분이 중요한 이유:
 * - Repository는 "데이터가 있는지 없는지"만 알려줍니다
 * - Use Case는 "없으면 어떻게 해야 하는지"를 결정합니다
 * - 어떤 Use Case는 없을 때 에러를 던지고, 어떤 Use Case는 기본값을 반환할 수 있습니다
 *
 * @example
 * ```typescript
 * const useCase = new GetTodoByIdUseCase(todoRepository);
 *
 * // 존재하는 ID
 * const todo = await useCase.execute(1); // Todo 반환
 *
 * // 존재하지 않는 ID
 * await useCase.execute(999); // TodoNotFoundError 발생!
 * ```
 */
export class GetTodoByIdUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * ID로 Todo를 조회합니다.
   *
   * @param id - 조회할 Todo의 ID
   * @returns Todo 엔티티
   * @throws TodoNotFoundError 해당 ID의 Todo가 존재하지 않는 경우
   */
  async execute(id: number): Promise<Todo> {
    const todo = await this.todoRepository.findById(id);

    // 비즈니스 규칙: 조회 대상이 반드시 존재해야 함
    if (!todo) {
      throw new TodoNotFoundError(id);
    }

    return todo;
  }
}
