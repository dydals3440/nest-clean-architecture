// src/todo/domain/use-cases/update-todo.use-case.ts

import { Todo } from '../entities/todo.entity';
import { TodoRepository } from '../repositories/todo.repository.interface';
import { TodoNotFoundError } from '../errors/todo-not-found.error';
import { TodoStatusType } from '../value-objects/todo-status.vo';

/**
 * Todo 수정에 필요한 입력 데이터를 정의하는 커맨드 타입
 *
 * 모든 필드가 선택적(optional)입니다.
 * 전달된 필드만 변경되고, 전달되지 않은 필드는 그대로 유지됩니다.
 * 이것을 "부분 업데이트(Partial Update)"라고 합니다.
 *
 * undefined vs null 구분:
 * - undefined: "이 필드를 변경하지 않겠다"
 * - null: "이 필드의 값을 제거하겠다" (description에만 해당)
 */
export interface UpdateTodoCommand {
  /** 수정 대상 Todo의 ID */
  id: number;

  /** 새 제목 (undefined면 변경 안 함) */
  title?: string;

  /** 새 설명 (undefined면 변경 안 함, null이면 설명 제거) */
  description?: string | null;

  /** 새 상태 (undefined면 변경 안 함) */
  status?: TodoStatusType;
}

/**
 * Todo 수정 유스케이스
 *
 * 기존 Todo를 조회한 후, 도메인 엔티티의 메서드를 통해 변경하고 저장합니다.
 *
 * 흐름:
 * 1. Repository에서 기존 Todo 조회
 * 2. 존재하지 않으면 TodoNotFoundError 발생
 * 3. 도메인 엔티티의 update() 메서드로 상태 변경
 *    (엔티티 내부에서 유효성 검증과 상태 전이 규칙이 적용됨)
 * 4. Repository를 통해 변경 사항 저장
 *
 * 이 패턴의 장점:
 * - 비즈니스 규칙이 엔티티에 캡슐화되어 있으므로, Use Case는 조율만 합니다
 * - 동일한 비즈니스 규칙이 여러 Use Case에서 자동으로 적용됩니다
 *
 * @example
 * ```typescript
 * const useCase = new UpdateTodoUseCase(todoRepository);
 *
 * // 제목만 변경
 * const updated = await useCase.execute({ id: 1, title: '새 제목' });
 *
 * // 상태 변경
 * const updated = await useCase.execute({
 *   id: 1,
 *   status: TODO_STATUS.IN_PROGRESS,
 * });
 *
 * // 설명 제거
 * const updated = await useCase.execute({ id: 1, description: null });
 * ```
 */
export class UpdateTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 수정을 실행합니다.
   *
   * @param command - 수정 커맨드
   * @returns 수정된 Todo 엔티티
   * @throws TodoNotFoundError 해당 ID의 Todo가 존재하지 않는 경우
   * @throws InvalidTodoTitleError 새 제목이 유효하지 않은 경우
   * @throws InvalidStatusTransitionError 허용되지 않는 상태 전이인 경우
   */
  async execute(command: UpdateTodoCommand): Promise<Todo> {
    // 1. 기존 Todo 조회
    const existingTodo = await this.todoRepository.findById(command.id);

    if (!existingTodo) {
      throw new TodoNotFoundError(command.id);
    }

    // 2. 도메인 엔티티의 메서드를 통해 상태 변경
    //    update() 내부에서:
    //    - title이 주어지면 updateTitle() 호출 → TodoTitle 유효성 검증
    //    - description이 주어지면 updateDescription() 호출
    //    - status가 주어지면 changeStatus() 호출 → 상태 전이 규칙 검증
    existingTodo.update({
      title: command.title,
      description: command.description,
      status: command.status,
    });

    // 3. 변경된 엔티티 저장
    const updatedTodo = await this.todoRepository.update(existingTodo);

    return updatedTodo;
  }
}
