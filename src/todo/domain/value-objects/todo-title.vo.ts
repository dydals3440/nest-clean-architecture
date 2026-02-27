import { InvalidTodoTitleError } from '../errors/invalid-todo-title.error';

/**
 * Todo 제목을 나타내는 Value Object
 *
 * 단순 string 대신 TodoTitle을 사용하는 이유:
 * 1. 제목에 대한 비즈니스 규칙(길이 제한, 공백 처리 등)을 한 곳에 캡슐화합니다
 * 2. TodoTitle 타입을 사용하는 곳은 항상 유효한 제목임이 보장됩니다
 * 3. 실수로 빈 문자열이나 너무 긴 문자열이 사용되는 것을 방지합니다
 *
 * 제목 규칙:
 * - 최소 1자 이상
 * - 최대 100자 이하
 * - 앞뒤 공백 자동 제거 (trim)
 * - 공백만으로 이루어진 문자열 불허
 *
 * @example
 * ```typescript
 * const title = TodoTitle.create('장보기');           // OK
 * const invalid = TodoTitle.create('');               // Error: 빈 제목
 * const tooLong = TodoTitle.create('a'.repeat(101));  // Error: 너무 김
 * const trimmed = TodoTitle.create('  장보기  ');     // OK, '장보기'로 저장
 * ```
 */
export class TodoTitle {
  /** 제목의 최소 길이 */
  static readonly MIN_LENGTH = 1;

  /** 제목의 최대 길이 */
  static readonly MAX_LENGTH = 100;

  /**
   * private 생성자: 반드시 create() 팩토리 메서드를 통해 생성
   *
   * 이 시점에서 value는 이미 유효성 검증과 trim이 완료된 상태입니다.
   */
  private constructor(private readonly _value: string) {}

  /**
   * 현재 제목 값을 읽기 전용으로 반환합니다.
   */
  get value(): string {
    return this._value;
  }

  /**
   * 문자열에서 TodoTitle을 생성합니다.
   *
   * 유효성 검증을 수행하고, 통과하면 새 인스턴스를 반환합니다.
   * 검증에 실패하면 InvalidTodoTitleError를 발생시킵니다.
   *
   * @param value - 제목 문자열
   * @returns 유효성이 보장된 TodoTitle 인스턴스
   * @throws InvalidTodoTitleError 유효성 검증 실패 시
   */
  static create(value: string): TodoTitle {
    // 1. null/undefined 체크
    if (value === null || value === undefined) {
      throw InvalidTodoTitleError.empty();
    }

    // 2. trim 처리 (앞뒤 공백 제거)
    const trimmed = value.trim();

    // 3. 빈 문자열 체크 (trim 후)
    if (trimmed.length === 0) {
      throw InvalidTodoTitleError.empty();
    }

    // 4. 최소 길이 체크
    if (trimmed.length < TodoTitle.MIN_LENGTH) {
      throw InvalidTodoTitleError.tooShort(trimmed, TodoTitle.MIN_LENGTH);
    }

    // 5. 최대 길이 체크
    if (trimmed.length > TodoTitle.MAX_LENGTH) {
      throw InvalidTodoTitleError.tooLong(trimmed, TodoTitle.MAX_LENGTH);
    }

    return new TodoTitle(trimmed);
  }

  /**
   * DB에서 읽어온 값으로 TodoTitle을 복원합니다.
   *
   * DB에 이미 저장된 값은 유효성이 보장된 것이므로,
   * 검증 없이 바로 생성합니다.
   *
   * ⚠️ 이 메서드는 Mapper에서만 사용해야 합니다.
   * 일반적인 생성에는 반드시 create()를 사용하세요.
   *
   * @param value - DB에서 읽어온 제목 문자열
   * @returns TodoTitle 인스턴스 (검증 없이 생성)
   */
  static reconstruct(value: string): TodoTitle {
    return new TodoTitle(value);
  }

  /**
   * Value Object 동등성 비교
   *
   * @param other - 비교 대상 TodoTitle
   * @returns 같은 제목인지 여부
   */
  equals(other: TodoTitle): boolean {
    if (!(other instanceof TodoTitle)) {
      return false;
    }
    return this._value === other._value;
  }

  /**
   * 제목의 글자 수를 반환합니다.
   */
  get length(): number {
    return this._value.length;
  }

  /**
   * 문자열 표현을 반환합니다.
   */
  toString(): string {
    return this._value;
  }
}
