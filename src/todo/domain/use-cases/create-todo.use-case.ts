import { Todo } from '../entities/todo.entity';
import { TodoRepository } from '../repositories/todo.repository.interface';

/**
 * Todo 생성에 필요한 입력 데이터를 정의하는 커맨드 타입
 *
 * "커맨드(Command)"라는 이름은 CQRS 패턴에서 유래합니다.
 * 시스템의 상태를 변경하는 의도를 나타냅니다.
 *
 * 이 타입은:
 * ✅ 순수 TypeScript 타입 (class-validator 데코레이터 없음)
 * ✅ 도메인 계층에 위치
 * ❌ HTTP 요청 형태와는 무관 (DTO와 구분)
 */
export interface CreateTodoCommand {
  /** Todo 제목 (필수) */
  title: string;

  /** Todo 설명 (선택) */
  description?: string | null;
}

/**
 * Todo 생성 유스케이스
 *
 * 새로운 Todo를 생성하고 저장합니다.
 *
 * 비즈니스 규칙:
 * 1. 제목은 비어있을 수 없습니다 (TodoTitle Value Object에서 검증)
 * 2. 제목은 100자를 초과할 수 없습니다
 * 3. 새 Todo의 초기 상태는 항상 PENDING입니다
 *
 * 의존성:
 * - TodoRepository 인터페이스에만 의존 (구현체에 의존하지 않음)
 *
 * @example
 * ```typescript
 * const useCase = new CreateTodoUseCase(todoRepository);
 * const todo = await useCase.execute({ title: '장보기', description: '우유 사기' });
 * ```
 */
export class CreateTodoUseCase {
  constructor(private readonly todoRepository: TodoRepository) {}

  /**
   * Todo 생성을 실행합니다.
   *
   * @param command - 생성 커맨드 (제목, 설명)
   * @returns 생성된 Todo 엔티티 (ID 할당됨)
   * @throws InvalidTodoTitleError 제목이 유효하지 않은 경우
   */
  async execute(command: CreateTodoCommand): Promise<Todo> {
    // 1. 도메인 엔티티 생성 (이 과정에서 유효성 검증이 수행됨)
    //    - Todo.create() 내부에서 TodoTitle.create()를 호출
    //    - TodoTitle.create()가 제목 유효성을 검증
    //    - 유효하지 않으면 InvalidTodoTitleError가 throw됨
    const todo = Todo.create(command.title, command.description);

    // 2. Repository를 통해 저장
    //    - 인터페이스의 save() 메서드를 호출
    //    - 실제 DB 저장은 구현체(PrismaTodoRepository)가 처리
    //    - 저장 후 ID가 할당된 Todo가 반환됨
    const savedTodo = await this.todoRepository.save(todo);

    return savedTodo;
  }
}
