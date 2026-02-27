import { Todo } from '../entities/todo.entity';
import {
  TodoRepository,
  PaginationOptions,
  TodoFilterOptions,
  PaginatedResult,
} from '../repositories/todo.repository.interface';

/**
 * Todo 목록 조회 옵션
 *
 * 페이지네이션과 필터링을 결합한 조회 조건입니다.
 */
export interface GetTodosQuery {
  /** 페이지네이션 옵션 */
  pagination?: PaginationOptions;

  /** 필터링 옵션 */
  filter?: TodoFilterOptions;
}

/**
 * Todo 목록 조회 유스케이스
 *
 * 페이지네이션과 필터링을 지원하는 목록 조회입니다.
 *
 * 이 Use Case는 "쿼리(Query)"에 해당합니다.
 * CQRS 패턴에서 상태를 변경하지 않는 조회 동작입니다.
 *
 * @example
 * ```typescript
 * const useCase = new GetTodosUseCase(todoRepository);
 *
 * // 기본 조회 (1페이지, 10개)
 * const result = await useCase.execute({});
 *
 * // 필터링 + 페이지네이션
 * const result = await useCase.execute({
 *   pagination: { page: 2, limit: 5 },
 *   filter: { status: TodoStatusEnum.PENDING },
 * });
 * ```
 */
export class GetTodosUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 목록 조회를 실행합니다.
   *
   * @param query - 조회 옵션 (페이지네이션, 필터링)
   * @returns 페이지네이션된 Todo 목록
   */
  async execute(query: GetTodosQuery): Promise<PaginatedResult<Todo>> {
    const { pagination, filter } = query;

    return this.todoRepository.findAll(pagination, filter);
  }
}
