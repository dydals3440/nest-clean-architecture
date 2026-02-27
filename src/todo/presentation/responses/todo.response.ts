import { Todo } from '../../domain/entities/todo.entity';

/**
 * Todo API 응답 형식
 *
 * 도메인 엔티티(Todo)를 API 클라이언트에게 적합한 형태로 변환합니다.
 *
 * 이 클래스가 엔티티와 다른 점:
 * 1. 모든 필드가 public readonly (직렬화를 위해)
 * 2. Value Object 대신 원시 타입 사용 (JSON 직렬화 용이)
 * 3. Date 객체 대신 ISO 문자열 (JSON 표준)
 * 4. 클라이언트에 필요한 필드만 포함
 *
 * @example
 * ```json
 * {
 *   "id": 1,
 *   "title": "장보기",
 *   "description": "우유, 빵, 계란 사기",
 *   "status": "PENDING",
 *   "isCompleted": false,
 *   "createdAt": "2024-01-15T10:30:00.000Z",
 *   "updatedAt": "2024-01-15T10:30:00.000Z"
 * }
 * ```
 */
export class TodoResponse {
  /** Todo ID */
  readonly id: number;

  /** 제목 */
  readonly title: string;

  /** 설명 (null이면 생략 가능) */
  readonly description: string | null;

  /** 상태 문자열 */
  readonly status: string;

  /** 완료 여부 (편의 필드) */
  readonly isCompleted: boolean;

  /** 전이 가능한 상태 목록 (UI 도우미 필드) */
  readonly availableTransitions: string[];

  /** 생성 시각 (ISO 8601) */
  readonly createdAt: string;

  /** 수정 시각 (ISO 8601) */
  readonly updatedAt: string;

  private constructor(todo: Todo) {
    this.id = todo.id!;
    this.title = todo.title;
    this.description = todo.description;
    this.status = todo.status;
    this.isCompleted = todo.isCompleted();
    this.availableTransitions = todo.getAvailableTransitions();
    this.createdAt = todo.createdAt.toISOString();
    this.updatedAt = todo.updatedAt.toISOString();
  }

  /**
   * 도메인 엔티티를 Response 객체로 변환합니다.
   *
   * @param todo - 도메인 엔티티
   * @returns API 응답 객체
   */
  static from(todo: Todo): TodoResponse {
    return new TodoResponse(todo);
  }

  /**
   * 도메인 엔티티 배열을 Response 배열로 변환합니다.
   *
   * @param todos - 도메인 엔티티 배열
   * @returns API 응답 객체 배열
   */
  static fromList(todos: Todo[]): TodoResponse[] {
    return todos.map((todo) => TodoResponse.from(todo));
  }
}

/**
 * 페이지네이션된 Todo 목록 응답
 *
 * 데이터와 함께 페이지네이션 메타 정보를 포함합니다.
 *
 * @example
 * ```json
 * {
 *   "data": [ ... ],
 *   "meta": {
 *     "total": 25,
 *     "page": 1,
 *     "limit": 10,
 *     "totalPages": 3
 *   }
 * }
 * ```
 */
export class PaginatedTodoResponse {
  readonly data: TodoResponse[];
  readonly meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };

  private constructor(
    data: TodoResponse[],
    meta: PaginatedTodoResponse['meta'],
  ) {
    this.data = data;
    this.meta = meta;
  }

  /**
   * PaginatedResult를 Response로 변환합니다.
   */
  static from(result: {
    data: Todo[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }): PaginatedTodoResponse {
    return new PaginatedTodoResponse(TodoResponse.fromList(result.data), {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  }
}
