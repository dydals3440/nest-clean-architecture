// src/todo/domain/value-objects/todo-status.vo.ts

import { InvalidStatusTransitionError } from '../errors/invalid-status-transition.error';

/**
 * Todo의 상태를 나타내는 상수 객체
 *
 * as const 패턴을 사용하여 리터럴 유니온 타입을 생성합니다.
 * enum 대비 장점: structural typing 기반이라 Array.includes() 등에서
 * unsafe-enum-comparison 문제가 발생하지 않습니다.
 */
export const TODO_STATUS = {
  /** 대기 중: 아직 시작하지 않은 상태 */
  PENDING: 'PENDING',

  /** 진행 중: 현재 작업 중인 상태 */
  IN_PROGRESS: 'IN_PROGRESS',

  /** 완료: 작업이 끝난 상태 */
  COMPLETED: 'COMPLETED',
} as const;

export type TodoStatusType = (typeof TODO_STATUS)[keyof typeof TODO_STATUS];

/**
 * 허용되는 상태 전이 규칙을 정의하는 맵
 *
 * 키: 현재 상태
 * 값: 전이 가능한 상태들의 배열
 *
 * 이 규칙은 다음과 같은 비즈니스 의미를 가집니다:
 *
 * PENDING → IN_PROGRESS: 작업 시작
 * PENDING → COMPLETED: 바로 완료 (간단한 작업)
 * IN_PROGRESS → COMPLETED: 작업 완료
 * IN_PROGRESS → PENDING: 작업 보류 (되돌리기)
 * COMPLETED → PENDING: 재작업 필요 (완료 취소)
 * COMPLETED → IN_PROGRESS: 불허 (완료 후 바로 진행 중으로 갈 수 없음, PENDING을 거쳐야 함)
 */
const ALLOWED_TRANSITIONS: Record<TodoStatusType, TodoStatusType[]> = {
  [TODO_STATUS.PENDING]: [TODO_STATUS.IN_PROGRESS, TODO_STATUS.COMPLETED],
  [TODO_STATUS.IN_PROGRESS]: [TODO_STATUS.COMPLETED, TODO_STATUS.PENDING],
  [TODO_STATUS.COMPLETED]: [TODO_STATUS.PENDING],
};

/**
 * Todo 상태를 나타내는 Value Object
 *
 * 단순 enum 사용 대신 Value Object로 감싸는 이유:
 * 1. 상태 전이 규칙이라는 비즈니스 로직을 캡슐화할 수 있습니다
 * 2. 유효하지 않은 상태 값의 생성을 방지합니다
 * 3. 상태 관련 도메인 로직을 한 곳에 모을 수 있습니다
 *
 * @example
 * ```typescript
 * const status = TodoStatus.create(TODO_STATUS.PENDING);
 * const nextStatus = status.transitionTo(TODO_STATUS.IN_PROGRESS); // OK
 * const invalid = status.transitionTo(TODO_STATUS.COMPLETED_AND_ARCHIVED); // 컴파일 에러
 * ```
 */
export class TodoStatus {
  /**
   * private 생성자: 외부에서 new로 직접 생성 불가
   * 반드시 정적 팩토리 메서드(create, fromString)를 사용해야 합니다.
   */
  private constructor(private readonly _value: TodoStatusType) {}

  /**
   * 현재 상태 값을 읽기 전용으로 반환합니다.
   */
  get value(): TodoStatusType {
    return this._value;
  }

  /**
   * 상태 값으로 TodoStatus를 생성합니다.
   *
   * @param status - TodoStatusType 값
   * @returns 새로운 TodoStatus 인스턴스
   *
   * @example
   * ```typescript
   * const pending = TodoStatus.create(TODO_STATUS.PENDING);
   * ```
   */
  static create(status: TodoStatusType): TodoStatus {
    return new TodoStatus(status);
  }

  /**
   * 문자열에서 TodoStatus를 생성합니다.
   *
   * DB에서 읽어온 문자열 값을 TodoStatus로 변환할 때 사용합니다.
   * 유효하지 않은 문자열이 들어오면 에러를 발생시킵니다.
   *
   * @param value - 상태를 나타내는 문자열
   * @returns 새로운 TodoStatus 인스턴스
   * @throws Error 유효하지 않은 상태 문자열인 경우
   *
   * @example
   * ```typescript
   * const status = TodoStatus.fromString('PENDING'); // OK
   * const invalid = TodoStatus.fromString('UNKNOWN'); // Error!
   * ```
   */
  static fromString(value: string): TodoStatus {
    const enumValue = Object.values(TODO_STATUS).find((v) => v === value);

    if (!enumValue) {
      throw new Error(
        `유효하지 않은 Todo 상태입니다: '${value}'. ` +
          `허용되는 값: ${Object.values(TODO_STATUS).join(', ')}`,
      );
    }

    return new TodoStatus(enumValue);
  }

  /**
   * 기본 상태(PENDING)로 TodoStatus를 생성합니다.
   *
   * 새로운 Todo를 만들 때 사용하는 편의 메서드입니다.
   *
   * @returns PENDING 상태의 TodoStatus
   */
  static default(): TodoStatus {
    return new TodoStatus(TODO_STATUS.PENDING);
  }

  /**
   * 주어진 상태로 전이가 가능한지 확인합니다.
   *
   * 실제 전이를 수행하지 않고, 가능 여부만 확인합니다.
   * UI에서 버튼 활성화/비활성화 등에 활용할 수 있습니다.
   *
   * @param target - 전이하려는 대상 상태
   * @returns 전이 가능 여부
   *
   * @example
   * ```typescript
   * const status = TodoStatus.create(TODO_STATUS.PENDING);
   * status.canTransitionTo(TODO_STATUS.IN_PROGRESS); // true
   * status.canTransitionTo(TODO_STATUS.COMPLETED);   // true
   * ```
   */
  canTransitionTo(target: TodoStatusType): boolean {
    // 같은 상태로의 전이는 허용하지 않음
    if (this._value === target) {
      return false;
    }

    return ALLOWED_TRANSITIONS[this._value].includes(target);
  }

  /**
   * 주어진 상태로 전이합니다.
   *
   * 전이가 허용되지 않으면 InvalidStatusTransitionError를 발생시킵니다.
   * 불변성 원칙에 따라 기존 객체를 변경하지 않고 새 인스턴스를 반환합니다.
   *
   * @param target - 전이할 대상 상태
   * @returns 새로운 상태의 TodoStatus 인스턴스
   * @throws InvalidStatusTransitionError 허용되지 않는 전이인 경우
   *
   * @example
   * ```typescript
   * const pending = TodoStatus.create(TODO_STATUS.PENDING);
   * const inProgress = pending.transitionTo(TODO_STATUS.IN_PROGRESS);
   * // pending은 여전히 PENDING (불변)
   * // inProgress는 IN_PROGRESS
   * ```
   */
  transitionTo(target: TodoStatusType): TodoStatus {
    if (!this.canTransitionTo(target)) {
      throw new InvalidStatusTransitionError(this._value, target);
    }

    return new TodoStatus(target);
  }

  /**
   * 현재 상태에서 전이 가능한 모든 상태를 반환합니다.
   *
   * UI에서 "다음 가능한 상태" 드롭다운을 구성할 때 유용합니다.
   *
   * @returns 전이 가능한 상태 열거형 배열
   */
  getAvailableTransitions(): TodoStatusType[] {
    return [...ALLOWED_TRANSITIONS[this._value]];
  }

  /**
   * 완료 상태인지 확인합니다.
   */
  isCompleted(): boolean {
    return this._value === TODO_STATUS.COMPLETED;
  }

  /**
   * 대기 중 상태인지 확인합니다.
   */
  isPending(): boolean {
    return this._value === TODO_STATUS.PENDING;
  }

  /**
   * 진행 중 상태인지 확인합니다.
   */
  isInProgress(): boolean {
    return this._value === TODO_STATUS.IN_PROGRESS;
  }

  /**
   * Value Object 동등성 비교
   *
   * 참조(===)가 아닌 내부 값으로 비교합니다.
   * 이것이 Value Object의 핵심 특성입니다.
   *
   * @param other - 비교 대상 TodoStatus
   * @returns 같은 상태인지 여부
   *
   * @example
   * ```typescript
   * const a = TodoStatus.create(TODO_STATUS.PENDING);
   * const b = TodoStatus.create(TODO_STATUS.PENDING);
   * a === b;      // false (다른 인스턴스)
   * a.equals(b);  // true  (같은 값)
   * ```
   */
  equals(other: TodoStatus): boolean {
    if (!(other instanceof TodoStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * 문자열 표현을 반환합니다.
   * 로깅, 디버깅 시 활용됩니다.
   */
  toString(): string {
    return this._value;
  }
}
