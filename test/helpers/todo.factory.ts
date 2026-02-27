// test/helpers/todo.factory.ts

/**
 * Todo 테스트 데이터 팩토리
 *
 * 테스트에서 필요한 Todo 데이터를 생성하는 유틸리티입니다.
 *
 * 팩토리 패턴을 사용하는 이유:
 * 1. 테스트마다 데이터를 수동으로 작성하면 중복이 많습니다.
 * 2. 기본값을 제공하여 테스트에서 관심 있는 필드만 오버라이드할 수 있습니다.
 * 3. 스키마가 변경되어도 팩토리만 수정하면 모든 테스트가 업데이트됩니다.
 */

/**
 * Todo 엔티티 생성에 필요한 속성 타입
 * (도메인 엔티티의 생성자 매개변수와 일치)
 */
export interface CreateTodoProps {
  id?: number;
  title?: string;
  description?: string | null;
  completed?: boolean;
  createdAt?: Date;
  updatedAt?: Date | null;
}

/**
 * CreateTodoDto에 해당하는 테스트 데이터 타입
 */
export interface CreateTodoDtoData {
  title?: string;
  description?: string;
}

/**
 * UpdateTodoDto에 해당하는 테스트 데이터 타입
 */
export interface UpdateTodoDtoData {
  title?: string;
  description?: string;
  completed?: boolean;
}

/**
 * Todo 데이터 팩토리
 *
 * @example
 * // 기본값으로 Todo 생성
 * const todo = TodoFactory.createProps();
 * // { id: 1, title: '테스트 할 일', description: null, completed: false, ... }
 *
 * // 특정 필드만 오버라이드
 * const completedTodo = TodoFactory.createProps({ completed: true, title: '완료된 할 일' });
 * // { id: 1, title: '완료된 할 일', description: null, completed: true, ... }
 *
 * // 여러 개 생성
 * const todoList = TodoFactory.createManyProps(5);
 * // [{ id: 1, ... }, { id: 2, ... }, ..., { id: 5, ... }]
 */
export class TodoFactory {
  private static counter = 0;

  /**
   * 고유한 ID를 생성합니다.
   * 테스트마다 다른 ID를 보장합니다.
   */
  private static nextId(): number {
    return ++TodoFactory.counter;
  }

  /**
   * 카운터를 초기화합니다.
   * beforeEach에서 호출하여 테스트 간 독립성을 보장합니다.
   */
  static reset(): void {
    TodoFactory.counter = 0;
  }

  /**
   * Todo 엔티티 생성 속성을 반환합니다.
   * 도메인 엔티티를 생성할 때 사용합니다.
   */
  static createProps(
    overrides: CreateTodoProps = {},
  ): Required<CreateTodoProps> {
    const id = overrides.id ?? TodoFactory.nextId();
    return {
      id,
      title: overrides.title ?? `테스트 할 일 ${id}`,
      description: overrides.description ?? null,
      completed: overrides.completed ?? false,
      createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: overrides.updatedAt ?? null,
    };
  }

  /**
   * 여러 개의 Todo 속성을 생성합니다.
   *
   * @param count - 생성할 개수
   * @param overrides - 모든 항목에 적용할 기본 오버라이드
   */
  static createManyProps(
    count: number,
    overrides: CreateTodoProps = {},
  ): Required<CreateTodoProps>[] {
    return Array.from({ length: count }, () =>
      TodoFactory.createProps(overrides),
    );
  }

  /**
   * CreateTodoDto에 해당하는 테스트 데이터를 생성합니다.
   * 컨트롤러/서비스 테스트에서 사용합니다.
   */
  static createDtoData(
    overrides: CreateTodoDtoData = {},
  ): Required<CreateTodoDtoData> {
    return {
      title: overrides.title ?? '새로운 할 일',
      description: overrides.description ?? '할 일 설명입니다',
    };
  }

  /**
   * UpdateTodoDto에 해당하는 테스트 데이터를 생성합니다.
   */
  static updateDtoData(overrides: UpdateTodoDtoData = {}): UpdateTodoDtoData {
    return {
      title: overrides.title,
      description: overrides.description,
      completed: overrides.completed,
    };
  }

  /**
   * DB 삽입용 레코드를 생성합니다.
   * 통합 테스트에서 DB에 직접 데이터를 삽입할 때 사용합니다.
   */
  static createDbRecord(overrides: CreateTodoProps = {}): {
    title: string;
    description: string | null;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date | null;
  } {
    return {
      title: overrides.title ?? `DB 테스트 할 일`,
      description: overrides.description ?? null,
      completed: overrides.completed ?? false,
      createdAt: overrides.createdAt ?? new Date(),
      updatedAt: overrides.updatedAt ?? null,
    };
  }
}
