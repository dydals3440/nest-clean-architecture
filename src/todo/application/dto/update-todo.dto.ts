import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsIn,
} from 'class-validator';
import {
  TODO_STATUS,
  TodoStatusType,
} from '../../domain/value-objects/todo-status.vo';

/**
 * Todo 수정 요청 DTO
 *
 * HTTP PUT/PATCH 요청의 body를 받아 유효성을 검증합니다.
 * 모든 필드가 선택적(optional)이어서 부분 업데이트를 지원합니다.
 *
 * 전달되지 않은 필드는 변경하지 않습니다.
 * 명시적으로 null을 전달한 description은 값을 제거합니다.
 *
 * @example
 * ```json
 * // 제목만 변경
 * { "title": "새 제목" }
 *
 * // 상태만 변경
 * { "status": "IN_PROGRESS" }
 *
 * // 설명 제거
 * { "description": null }
 *
 * // 여러 필드 동시 변경
 * {
 *   "title": "새 제목",
 *   "description": "새 설명",
 *   "status": "COMPLETED"
 * }
 * ```
 */
export class UpdateTodoDto {
  /**
   * 새 제목 (선택)
   */
  @IsOptional()
  @IsString({ message: '제목은 문자열이어야 합니다.' })
  @MinLength(1, { message: '제목은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '제목은 최대 100자까지 가능합니다.' })
  title?: string;

  /**
   * 새 설명 (선택)
   * null을 전달하면 설명을 제거합니다.
   */
  @IsOptional()
  @IsString({ message: '설명은 문자열이어야 합니다.' })
  @MaxLength(500, { message: '설명은 최대 500자까지 가능합니다.' })
  description?: string | null;

  /**
   * 새 상태 (선택)
   *
   * @IsIn()으로 TODO_STATUS의 값만 허용합니다.
   * 허용 값: 'PENDING', 'IN_PROGRESS', 'COMPLETED'
   */
  @IsOptional()
  @IsIn(Object.values(TODO_STATUS), {
    message: `상태는 ${Object.values(TODO_STATUS).join(', ')} 중 하나여야 합니다.`,
  })
  status?: TodoStatusType;
}
