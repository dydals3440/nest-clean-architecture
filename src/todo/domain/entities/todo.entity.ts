// src/todo/domain/entities/todo.entity.ts

import { TodoTitle } from '../value-objects/todo-title.vo';
import {
  TodoStatus,
  TODO_STATUS,
  TodoStatusType,
} from '../value-objects/todo-status.vo';

/**
 * Todo 도메인 엔티티
 *
 * 이 클래스는 Todo 도메인의 핵심 비즈니스 로직을 담고 있습니다.
 * 프레임워크(NestJS)나 ORM(Prisma)에 대한 의존성이 전혀 없는
 * 순수 TypeScript 클래스입니다.
 *
 * 설계 원칙:
 * 1. 모든 상태 변경은 도메인 메서드를 통해서만 가능합니다
 * 2. getter를 통해 읽기만 허용하고, setter는 제공하지 않습니다
 * 3. 생성은 팩토리 메서드(create, reconstruct)로만 가능합니다
 * 4. 비즈니스 규칙은 엔티티 내부에 캡슐화됩니다
 *
 * 이 엔티티가 "빈혈 모델(Anemic Model)"이 아닌 이유:
 * - 상태와 행위가 함께 존재합니다 (complete(), updateTitle() 등)
 * - 비즈니스 규칙이 엔티티 내부에 있습니다 (유효성 검증, 상태 전이)
 * - 외부에서 직접 상태를 변경할 수 없습니다 (private 필드 + getter)
 */
export class Todo {
  /**
   * private 생성자: 외부에서 new Todo()로 직접 생성 불가
   * 반드시 정적 팩토리 메서드(create, reconstruct)를 사용해야 합니다.
   *
   * 모든 필드가 private이며, getter를 통해서만 읽을 수 있습니다.
   * 이로써 외부에서 직접 필드를 변경하는 것을 방지합니다.
   */
  private constructor(
    private readonly _id: number | null,
    private _title: TodoTitle,
    private _description: string | null,
    private _status: TodoStatus,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // ─────────────────────────────────────────────
  // Getters (읽기 전용 접근자)
  // ─────────────────────────────────────────────

  /**
   * Todo의 고유 식별자
   *
   * 새로 생성된 아직 저장되지 않은 Todo는 id가 null입니다.
   * DB에 저장되면 auto-increment된 숫자 ID를 가집니다.
   */
  get id(): number | null {
    return this._id;
  }

  /**
   * Todo 제목
   *
   * TodoTitle Value Object의 문자열 값을 반환합니다.
   * Value Object 자체가 필요한 경우 titleVO를 사용하세요.
   */
  get title(): string {
    return this._title.value;
  }

  /**
   * Todo 제목의 Value Object를 반환합니다.
   *
   * Value Object의 메서드(equals, length 등)가 필요할 때 사용합니다.
   */
  get titleVO(): TodoTitle {
    return this._title;
  }

  /**
   * Todo 설명 (선택적 필드)
   *
   * 상세 설명이 없으면 null을 반환합니다.
   */
  get description(): string | null {
    return this._description;
  }

  /**
   * Todo 상태 (문자열)
   *
   * TodoStatus Value Object의 열거형 값을 반환합니다.
   */
  get status(): TodoStatusType {
    return this._status.value;
  }

  /**
   * Todo 상태의 Value Object를 반환합니다.
   *
   * 상태 전이 확인(canTransitionTo) 등이 필요할 때 사용합니다.
   */
  get statusVO(): TodoStatus {
    return this._status;
  }

  /**
   * 생성 시각 (불변)
   *
   * 한번 생성되면 변경되지 않습니다.
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 마지막 수정 시각
   *
   * 상태 변경 메서드가 호출될 때마다 자동으로 갱신됩니다.
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  // ─────────────────────────────────────────────
  // 정적 팩토리 메서드 (Static Factory Methods)
  // ─────────────────────────────────────────────

  /**
   * 새로운 Todo를 생성합니다.
   *
   * 이 메서드는 사용자가 새 Todo를 만들 때 사용합니다.
   * - ID는 null (DB에서 자동 생성)
   * - 상태는 기본값(PENDING)
   * - 생성/수정 시각은 현재 시각
   *
   * @param title - Todo 제목 (유효성 검증됨)
   * @param description - Todo 설명 (선택)
   * @returns 새로운 Todo 엔티티
   * @throws InvalidTodoTitleError 제목이 유효하지 않은 경우
   *
   * @example
   * ```typescript
   * const todo = Todo.create('장보기', '우유, 빵, 계란 사기');
   * console.log(todo.id);     // null (아직 저장 안 됨)
   * console.log(todo.status); // 'PENDING'
   * ```
   */
  static create(title: string, description?: string | null): Todo {
    const now = new Date();

    return new Todo(
      null, // id는 DB에서 생성
      TodoTitle.create(title), // Value Object로 변환 + 유효성 검증
      description ?? null,
      TodoStatus.default(), // PENDING
      now,
      now,
    );
  }

  /**
   * DB에서 읽어온 데이터로 Todo 엔티티를 복원합니다.
   *
   * 이 메서드는 Repository의 Mapper에서만 사용합니다.
   * DB에 이미 저장된 데이터는 유효성이 보장되어 있으므로,
   * Value Object의 reconstruct를 사용하여 검증을 생략합니다.
   *
   * ⚠️ 일반 코드에서 이 메서드를 사용하지 마세요.
   * 새로운 Todo 생성에는 반드시 create()를 사용하세요.
   *
   * @param id - DB의 기본 키
   * @param title - 저장된 제목
   * @param description - 저장된 설명
   * @param status - 저장된 상태 문자열
   * @param createdAt - 저장된 생성 시각
   * @param updatedAt - 저장된 수정 시각
   * @returns 복원된 Todo 엔티티
   */
  static reconstruct(
    id: number,
    title: string,
    description: string | null,
    status: string,
    createdAt: Date,
    updatedAt: Date,
  ): Todo {
    return new Todo(
      id,
      TodoTitle.reconstruct(title), // 검증 생략
      description,
      TodoStatus.fromString(status), // enum 변환만 수행
      createdAt,
      updatedAt,
    );
  }

  // ─────────────────────────────────────────────
  // 도메인 행위 메서드 (Domain Behavior Methods)
  // ─────────────────────────────────────────────

  /**
   * Todo를 완료 상태로 변경합니다.
   *
   * 비즈니스 규칙:
   * - PENDING → COMPLETED: 허용
   * - IN_PROGRESS → COMPLETED: 허용
   * - COMPLETED → COMPLETED: 이미 완료 상태이므로 무시 (멱등성)
   *
   * @throws InvalidStatusTransitionError 전이가 불가능한 상태인 경우
   *
   * @example
   * ```typescript
   * const todo = Todo.create('장보기');
   * todo.complete();
   * console.log(todo.status); // 'COMPLETED'
   * ```
   */
  complete(): void {
    // 이미 완료 상태면 아무것도 하지 않음 (멱등성)
    if (this._status.isCompleted()) {
      return;
    }

    this._status = this._status.transitionTo(TODO_STATUS.COMPLETED);
    this._updatedAt = new Date();
  }

  /**
   * Todo를 미완료(PENDING) 상태로 되돌립니다.
   *
   * 비즈니스 규칙:
   * - COMPLETED → PENDING: 허용 (재작업 필요)
   * - IN_PROGRESS → PENDING: 허용 (보류)
   * - PENDING → PENDING: 이미 대기 상태이므로 무시 (멱등성)
   *
   * @throws InvalidStatusTransitionError 전이가 불가능한 상태인 경우
   */
  uncomplete(): void {
    // 이미 PENDING 상태면 아무것도 하지 않음 (멱등성)
    if (this._status.isPending()) {
      return;
    }

    this._status = this._status.transitionTo(TODO_STATUS.PENDING);
    this._updatedAt = new Date();
  }

  /**
   * Todo 상태를 토글합니다.
   *
   * - 완료 상태(COMPLETED) → 미완료(PENDING)
   * - 그 외 모든 상태 → 완료(COMPLETED)
   *
   * 간단한 체크박스 UI에서 사용하기 좋은 메서드입니다.
   */
  toggleComplete(): void {
    if (this._status.isCompleted()) {
      this.uncomplete();
    } else {
      this.complete();
    }
  }

  /**
   * Todo 상태를 특정 상태로 변경합니다.
   *
   * complete(), uncomplete()보다 세밀한 제어가 필요할 때 사용합니다.
   * 예: PENDING → IN_PROGRESS 전이
   *
   * @param newStatus - 변경할 상태
   * @throws InvalidStatusTransitionError 허용되지 않는 전이인 경우
   */
  changeStatus(newStatus: TodoStatusType): void {
    if (this._status.value === newStatus) {
      return; // 같은 상태로의 변경은 무시 (멱등성)
    }

    this._status = this._status.transitionTo(newStatus);
    this._updatedAt = new Date();
  }

  /**
   * Todo 제목을 변경합니다.
   *
   * 새 제목에 대한 유효성 검증이 자동으로 수행됩니다.
   * (TodoTitle.create() 내부에서 검증)
   *
   * @param newTitle - 새 제목 문자열
   * @throws InvalidTodoTitleError 새 제목이 유효하지 않은 경우
   *
   * @example
   * ```typescript
   * const todo = Todo.create('장보기');
   * todo.updateTitle('마트 장보기');
   * console.log(todo.title); // '마트 장보기'
   * ```
   */
  updateTitle(newTitle: string): void {
    // TodoTitle.create()가 유효성 검증을 수행합니다
    const newTitleVO = TodoTitle.create(newTitle);

    // 같은 제목이면 변경하지 않음
    if (this._title.equals(newTitleVO)) {
      return;
    }

    this._title = newTitleVO;
    this._updatedAt = new Date();
  }

  /**
   * Todo 설명을 변경합니다.
   *
   * null을 전달하면 설명을 제거합니다.
   *
   * @param newDescription - 새 설명 문자열 (null이면 설명 제거)
   */
  updateDescription(newDescription: string | null): void {
    // 빈 문자열은 null로 처리
    const sanitized = newDescription?.trim() || null;

    // 같은 설명이면 변경하지 않음
    if (this._description === sanitized) {
      return;
    }

    this._description = sanitized;
    this._updatedAt = new Date();
  }

  /**
   * 제목과 설명을 한꺼번에 변경합니다.
   *
   * 부분 업데이트를 지원합니다:
   * - undefined가 전달된 필드는 변경하지 않습니다
   * - null이 명시적으로 전달된 description은 제거합니다
   *
   * @param params - 변경할 필드들
   * @throws InvalidTodoTitleError 새 제목이 유효하지 않은 경우
   */
  update(params: {
    title?: string;
    description?: string | null;
    status?: TodoStatusType;
  }): void {
    if (params.title !== undefined) {
      this.updateTitle(params.title);
    }

    if (params.description !== undefined) {
      this.updateDescription(params.description);
    }

    if (params.status !== undefined) {
      this.changeStatus(params.status);
    }
  }

  // ─────────────────────────────────────────────
  // 도메인 조회 메서드 (Query Methods)
  // ─────────────────────────────────────────────

  /**
   * Todo가 완료되었는지 확인합니다.
   */
  isCompleted(): boolean {
    return this._status.isCompleted();
  }

  /**
   * Todo가 아직 저장되지 않은 새 엔티티인지 확인합니다.
   *
   * ID가 null이면 아직 DB에 저장되지 않은 상태입니다.
   */
  isNew(): boolean {
    return this._id === null;
  }

  /**
   * 주어진 상태로의 전이가 가능한지 확인합니다.
   *
   * @param targetStatus - 확인할 대상 상태
   * @returns 전이 가능 여부
   */
  canTransitionTo(targetStatus: TodoStatusType): boolean {
    return this._status.canTransitionTo(targetStatus);
  }

  /**
   * 현재 상태에서 전이 가능한 모든 상태를 반환합니다.
   */
  getAvailableTransitions(): TodoStatusType[] {
    return this._status.getAvailableTransitions();
  }

  // ─────────────────────────────────────────────
  // 동등성 비교
  // ─────────────────────────────────────────────

  /**
   * 엔티티 동등성 비교
   *
   * 엔티티는 ID로 동등성을 판단합니다.
   * 같은 ID를 가진 두 엔티티는 같은 엔티티로 간주합니다.
   * (다른 속성이 달라도!)
   *
   * @param other - 비교 대상 Todo
   * @returns 같은 엔티티인지 여부
   */
  equals(other: Todo): boolean {
    if (!(other instanceof Todo)) {
      return false;
    }

    // 둘 다 새 엔티티(id === null)이면 참조 비교
    if (this._id === null && other._id === null) {
      return this === other;
    }

    return this._id === other._id;
  }
}
