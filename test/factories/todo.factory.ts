// test/factories/todo.factory.ts

/**
 * Todo 팩토리
 *
 * 테스트 데이터를 동적으로 생성한다.
 * 기본값을 제공하되, 오버라이드로 커스터마이징 가능하다.
 */

// ─── 타입 정의 ───

export interface CreateTodoInput {
  title: string;
  description?: string;
}

interface CreateTodoOverrides {
  title?: string;
  description?: string;
}

interface TodoEntity {
  id: number;
  title: string;
  description: string | null;
  status: string;
  isCompleted: boolean;
  availableTransitions: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateTodoInput {
  title?: string;
  description?: string | null;
  status?: string;
}

// ─── 팩토리 클래스 ───

export class TodoFactory {
  private static counter = 0;

  /**
   * 고유한 카운터를 사용하여 중복 없는 데이터 생성
   */
  private static nextCounter(): number {
    return ++TodoFactory.counter;
  }

  /**
   * 카운터 초기화 (테스트 간 격리를 위해)
   */
  static reset(): void {
    TodoFactory.counter = 0;
  }

  /**
   * Todo 생성 요청 DTO 생성
   */
  static createDto(overrides?: CreateTodoOverrides): CreateTodoInput {
    const count = TodoFactory.nextCounter();
    return {
      title: `테스트 할 일 #${count}`,
      description: `테스트 설명 #${count}`,
      ...overrides,
    };
  }

  /**
   * Todo 엔티티 생성 (API 응답 형태)
   */
  static entity(overrides?: Partial<TodoEntity>): TodoEntity {
    const count = TodoFactory.nextCounter();
    const now = new Date();
    return {
      id: count,
      title: `테스트 할 일 #${count}`,
      description: `테스트 설명 #${count}`,
      status: 'PENDING',
      isCompleted: false,
      availableTransitions: ['IN_PROGRESS', 'COMPLETED'],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * Todo 수정 요청 DTO 생성
   */
  static updateDto(overrides?: Partial<UpdateTodoInput>): UpdateTodoInput {
    return {
      title: '수정된 제목',
      ...overrides,
    };
  }

  /**
   * 여러 Todo 생성 DTO를 한번에 생성
   */
  static createManyDtos(
    count: number,
    overrides?: CreateTodoOverrides,
  ): CreateTodoInput[] {
    return Array.from({ length: count }, () =>
      TodoFactory.createDto(overrides),
    );
  }

  /**
   * 완료된 Todo 엔티티 생성
   */
  static completedEntity(overrides?: Partial<TodoEntity>): TodoEntity {
    return TodoFactory.entity({
      status: 'COMPLETED',
      isCompleted: true,
      availableTransitions: ['PENDING'],
      ...overrides,
    });
  }

  /**
   * 특수한 케이스의 Todo 생성
   */
  static withLongTitle(): CreateTodoInput {
    return TodoFactory.createDto({
      title: 'a'.repeat(100), // DTO 최대 길이
    });
  }

  static withoutDescription(): CreateTodoInput {
    const count = TodoFactory.nextCounter();
    return { title: `테스트 할 일 #${count}` };
  }

  static withSpecialCharacters(): CreateTodoInput {
    return TodoFactory.createDto({
      title: '특수문자: <>&"\'`',
      description: '줄바꿈\n탭\t포함',
    });
  }
}
