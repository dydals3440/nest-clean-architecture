import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Todo 생성 요청 DTO
 *
 * HTTP POST 요청의 body를 받아 유효성을 검증합니다.
 *
 * class-validator 데코레이터로 기본적인 형식 검증을 수행합니다:
 * - 타입 검사 (@IsString)
 * - 필수값 검사 (@IsNotEmpty)
 * - 길이 제한 (@MinLength, @MaxLength)
 *
 * ⚠️ 이 DTO의 검증은 "입력 형식" 검증입니다.
 * "비즈니스 규칙" 검증은 도메인 계층(TodoTitle Value Object)에서 수행합니다.
 *
 * 두 레이어의 검증이 겹치는 것은 의도적입니다:
 * - DTO: 잘못된 HTTP 요청을 빠르게 거부 (400 Bad Request)
 * - Domain: 비즈니스 규칙 위반을 감지 (도메인 에러)
 *
 * @example
 * ```json
 * // 유효한 요청
 * {
 *   "title": "장보기",
 *   "description": "우유, 빵, 계란 사기"
 * }
 *
 * // 유효하지 않은 요청 (title 누락)
 * {
 *   "description": "설명만 있음"
 * }
 * ```
 */
export class CreateTodoDto {
  /**
   * Todo 제목
   *
   * @IsString(): 문자열 타입이어야 합니다
   * @IsNotEmpty(): 빈 문자열이 아니어야 합니다
   * @MinLength(1): 최소 1자 이상
   * @MaxLength(100): 최대 100자 이하
   */
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '제목은 필수입니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
  title!: string;

  /**
   * Todo 설명 (선택)
   *
   * @IsOptional(): 이 필드는 생략 가능합니다
   * @IsString(): 제공되는 경우 문자열이어야 합니다
   * @MaxLength(500): 최대 500자 이하
   */
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @MaxLength(500, { message: '설명은 최대 500자까지 가능합니다.' })
  description?: string;
}
