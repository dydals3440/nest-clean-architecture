import { Injectable, Inject } from '@nestjs/common';

import { Todo } from '../../domain/entities/todo.entity';
import {
  TodoRepository,
  TODO_REPOSITORY,
  PaginatedResult,
} from '../../domain/repositories/todo.repository.interface';
import { TodoStatusType } from '../../domain/value-objects/todo-status.vo';

import { CreateTodoUseCase } from '../../domain/use-cases/create-todo.use-case';
import { GetTodosUseCase } from '../../domain/use-cases/get-todos.use-case';
import { GetTodoByIdUseCase } from '../../domain/use-cases/get-todo-by-id.use-case';
import { UpdateTodoUseCase } from '../../domain/use-cases/update-todo.use-case';
import { DeleteTodoUseCase } from '../../domain/use-cases/delete-todo.use-case';
import { ToggleTodoUseCase } from '../../domain/use-cases/toggle-todo.use-case';

import { CreateTodoDto } from '../dto/create-todo.dto';
import { UpdateTodoDto } from '../dto/update-todo.dto';

/**
 * Todo 애플리케이션 서비스
 *
 * 이 서비스는 Domain Layer의 Use Case들을 NestJS와 연결하는 역할을 합니다.
 *
 * 핵심 역할:
 * 1. NestJS DI로부터 Repository 구현체를 주입받습니다
 * 2. Use Case 인스턴스를 생성하고 Repository를 전달합니다
 * 3. Controller로부터 받은 DTO를 Use Case Command로 변환합니다
 * 4. Use Case의 execute()를 호출하고 결과를 반환합니다
 *
 * 이 서비스는 비즈니스 로직을 직접 구현하지 않습니다.
 * 비즈니스 로직은 Use Case와 도메인 엔티티에 위임합니다.
 *
 * 의존성:
 * - TodoRepository 인터페이스 (Domain Layer) - @Inject 주입
 * - Use Case 클래스들 (Domain Layer) - 직접 인스턴스화
 * - DTO 클래스들 (Application Layer) - 같은 계층
 */
@Injectable()
export class TodoService {
  // Use Case 인스턴스들을 필드로 보관합니다
  private readonly createTodoUseCase: CreateTodoUseCase;
  private readonly getTodosUseCase: GetTodosUseCase;
  private readonly getTodoByIdUseCase: GetTodoByIdUseCase;
  private readonly updateTodoUseCase: UpdateTodoUseCase;
  private readonly deleteTodoUseCase: DeleteTodoUseCase;
  private readonly toggleTodoUseCase: ToggleTodoUseCase;

  constructor(
    /**
     * Repository 인터페이스 주입
     *
     * TODO_REPOSITORY Symbol 토큰으로 주입받습니다.
     * 실제로는 PrismaTodoRepository가 주입됩니다.
     * (TodoInfrastructureModule에서 바인딩됨)
     *
     * 하지만 이 서비스는 PrismaTodoRepository를 모릅니다.
     * TodoRepository 인터페이스만 알고 있습니다.
     */
    @Inject(TODO_REPOSITORY)
    private readonly todoRepository: TodoRepository,
  ) {
    // Use Case 인스턴스 생성 시 Repository를 주입합니다
    // 각 Use Case는 동일한 Repository 인스턴스를 공유합니다
    this.createTodoUseCase = new CreateTodoUseCase(this.todoRepository);
    this.getTodosUseCase = new GetTodosUseCase(this.todoRepository);
    this.getTodoByIdUseCase = new GetTodoByIdUseCase(this.todoRepository);
    this.updateTodoUseCase = new UpdateTodoUseCase(this.todoRepository);
    this.deleteTodoUseCase = new DeleteTodoUseCase(this.todoRepository);
    this.toggleTodoUseCase = new ToggleTodoUseCase(this.todoRepository);
  }

  /**
   * 새로운 Todo를 생성합니다.
   *
   * DTO를 Use Case Command로 변환하고 실행합니다.
   *
   * @param dto - CreateTodoDto (HTTP 요청 body)
   * @returns 생성된 Todo 엔티티
   * @throws InvalidTodoTitleError 제목이 유효하지 않은 경우
   */
  async create(dto: CreateTodoDto): Promise<Todo> {
    return this.createTodoUseCase.execute({
      title: dto.title,
      description: dto.description ?? null,
    });
  }

  /**
   * Todo 목록을 조회합니다.
   *
   * 페이지네이션과 필터링을 지원합니다.
   *
   * @param page - 페이지 번호 (기본: 1)
   * @param limit - 페이지당 항목 수 (기본: 10)
   * @param status - 상태 필터 (선택)
   * @param titleSearch - 제목 검색어 (선택)
   * @returns 페이지네이션된 Todo 목록
   */
  async findAll(
    page?: number,
    limit?: number,
    status?: TodoStatusType,
    titleSearch?: string,
  ): Promise<PaginatedResult<Todo>> {
    return this.getTodosUseCase.execute({
      pagination: { page, limit },
      filter: { status, titleSearch },
    });
  }

  /**
   * ID로 단일 Todo를 조회합니다.
   *
   * @param id - Todo ID
   * @returns Todo 엔티티
   * @throws TodoNotFoundError 존재하지 않는 ID인 경우
   */
  async findById(id: number): Promise<Todo> {
    return this.getTodoByIdUseCase.execute(id);
  }

  /**
   * 기존 Todo를 수정합니다.
   *
   * DTO를 Use Case Command로 변환하고 실행합니다.
   *
   * @param id - 수정할 Todo의 ID
   * @param dto - UpdateTodoDto (HTTP 요청 body)
   * @returns 수정된 Todo 엔티티
   * @throws TodoNotFoundError 존재하지 않는 ID인 경우
   * @throws InvalidTodoTitleError 새 제목이 유효하지 않은 경우
   * @throws InvalidStatusTransitionError 허용되지 않는 상태 전이인 경우
   */
  async update(id: number, dto: UpdateTodoDto): Promise<Todo> {
    return this.updateTodoUseCase.execute({
      id,
      title: dto.title,
      description: dto.description,
      status: dto.status,
    });
  }

  /**
   * Todo를 삭제합니다.
   *
   * @param id - 삭제할 Todo의 ID
   * @throws TodoNotFoundError 존재하지 않는 ID인 경우
   */
  async remove(id: number): Promise<void> {
    return this.deleteTodoUseCase.execute(id);
  }

  /**
   * Todo의 완료 상태를 토글합니다.
   *
   * @param id - 토글할 Todo의 ID
   * @returns 토글된 Todo 엔티티
   * @throws TodoNotFoundError 존재하지 않는 ID인 경우
   */
  async toggle(id: number): Promise<Todo> {
    return this.toggleTodoUseCase.execute(id);
  }
}
