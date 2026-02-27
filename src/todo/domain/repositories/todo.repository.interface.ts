import { Todo } from '../entities/todo.entity';
import { TodoStatusType } from '../value-objects/todo-status.vo';

/**
 * DI(의존성 주입)에서 사용할 토큰
 *
 * NestJS에서 인터페이스는 런타임에 존재하지 않으므로,
 * 의존성 주입 시 인터페이스 자체를 토큰으로 사용할 수 없습니다.
 * 대신 Symbol을 토큰으로 사용합니다.
 *
 * Symbol을 사용하는 이유:
 * 1. 유일성 보장: Symbol은 항상 고유한 값입니다
 * 2. 충돌 방지: 문자열 토큰은 실수로 중복될 수 있지만, Symbol은 불가능합니다
 * 3. 명시적 참조: import하여 사용하므로 오타 위험이 없습니다
 *
 * @example
 * ```typescript
 * // Module에서 바인딩
 * { provide: TODO_REPOSITORY, useClass: PrismaTodoRepository }
 *
 * // Service에서 주입
 * constructor(@Inject(TODO_REPOSITORY) private repo: TodoRepository) {}
 * ```
 */
export const TODO_REPOSITORY = Symbol('TODO_REPOSITORY');

/**
 * 페이지네이션 옵션
 *
 * 목록 조회 시 페이지 단위로 데이터를 가져오기 위한 옵션입니다.
 */
export interface PaginationOptions {
  /**
   * 페이지 번호 (1부터 시작)
   * @default 1
   */
  page?: number;

  /**
   * 페이지당 항목 수
   * @default 10
   */
  limit?: number;
}

/**
 * Todo 필터링 옵션
 *
 * 목록 조회 시 특정 조건으로 필터링하기 위한 옵션입니다.
 */
export interface TodoFilterOptions {
  /** 상태로 필터링 */
  status?: TodoStatusType;

  /** 제목 검색 (부분 일치) */
  titleSearch?: string;
}

/**
 * Todo 목록 조회 결과
 *
 * 페이지네이션 메타 정보와 함께 결과를 반환합니다.
 */
export interface PaginatedResult<T> {
  /** 현재 페이지의 데이터 목록 */
  data: T[];

  /** 전체 항목 수 (필터 적용 후) */
  total: number;

  /** 현재 페이지 번호 */
  page: number;

  /** 페이지당 항목 수 */
  limit: number;

  /** 전체 페이지 수 */
  totalPages: number;
}

/**
 * Todo Repository 인터페이스 (Port)
 *
 * 도메인 계층에서 정의하는 데이터 접근 계약(Contract)입니다.
 *
 * 이 인터페이스의 핵심 역할:
 * 1. **의존성 역전**: 도메인이 인프라에 의존하지 않도록 합니다
 * 2. **테스트 용이성**: Mock/Stub으로 교체하여 단위 테스트가 가능합니다
 * 3. **교체 가능성**: DB를 변경해도 이 인터페이스를 구현한 새 Adapter만 만들면 됩니다
 *
 * 이 인터페이스는:
 * ✅ 도메인 엔티티(Todo)만 사용합니다
 * ✅ 도메인 Value Object(TodoStatusType)만 사용합니다
 * ❌ Prisma, SQL, DB 테이블 등 인프라 개념을 사용하지 않습니다
 * ❌ NestJS 데코레이터를 사용하지 않습니다
 *
 * @example
 * ```typescript
 * // 구현체 바인딩 (Module에서)
 * providers: [
 *   { provide: TODO_REPOSITORY, useClass: PrismaTodoRepository },
 * ]
 *
 * // Mock으로 교체 (테스트에서)
 * providers: [
 *   { provide: TODO_REPOSITORY, useClass: InMemoryTodoRepository },
 * ]
 * ```
 */
export interface TodoRepository {
  /**
   * 전체 Todo 목록을 조회합니다.
   *
   * 페이지네이션과 필터링을 지원합니다.
   * 옵션이 주어지지 않으면 기본값(page: 1, limit: 10)을 사용합니다.
   *
   * @param pagination - 페이지네이션 옵션
   * @param filter - 필터링 옵션
   * @returns 페이지네이션된 Todo 목록
   */
  findAll(
    pagination?: PaginationOptions,
    filter?: TodoFilterOptions,
  ): Promise<PaginatedResult<Todo>>;

  /**
   * ID로 단일 Todo를 조회합니다.
   *
   * 존재하지 않는 ID면 null을 반환합니다.
   * (에러를 throw하지 않음 - null 반환은 Repository의 책임,
   *  에러 throw는 Use Case의 책임)
   *
   * @param id - Todo의 고유 식별자
   * @returns Todo 엔티티 또는 null
   */
  findById(id: number): Promise<Todo | null>;

  /**
   * 특정 상태의 Todo 목록을 조회합니다.
   *
   * @param status - 조회할 상태
   * @returns 해당 상태의 Todo 목록
   */
  findByStatus(status: TodoStatusType): Promise<Todo[]>;

  /**
   * 새로운 Todo를 저장합니다.
   *
   * DB에 insert하고, 생성된 ID가 포함된 Todo를 반환합니다.
   *
   * @param todo - 저장할 Todo 엔티티 (id는 null)
   * @returns 저장된 Todo 엔티티 (id가 할당됨)
   */
  save(todo: Todo): Promise<Todo>;

  /**
   * 기존 Todo를 업데이트합니다.
   *
   * 엔티티의 현재 상태를 DB에 반영합니다.
   *
   * @param todo - 업데이트할 Todo 엔티티 (id 필수)
   * @returns 업데이트된 Todo 엔티티
   */
  update(todo: Todo): Promise<Todo>;

  /**
   * Todo를 삭제합니다.
   *
   * @param id - 삭제할 Todo의 ID
   */
  delete(id: number): Promise<void>;

  /**
   * 전체 Todo 수를 반환합니다.
   *
   * 필터 조건이 주어지면 해당 조건에 맞는 Todo만 카운트합니다.
   *
   * @param filter - 필터링 옵션 (선택)
   * @returns Todo 수
   */
  count(filter?: TodoFilterOptions): Promise<number>;
}
