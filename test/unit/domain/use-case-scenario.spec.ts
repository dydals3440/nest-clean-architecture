// 단위테스트에서는 실제 Repository 대신 Fake Repository를 사용하여 Use Case 시나리오를 테스트할 수 있습니다. (비즈니스 로직을 빠르게 검증하는데 효과, 단 실제 DB와의 상호작용은 보장하지 못함.)
import { CreateTodoUseCase } from '@/todo/domain/use-cases/create-todo.use-case';
import { GetTodoByIdUseCase } from '@/todo/domain/use-cases/get-todo-by-id.use-case';
import { ToggleTodoUseCase } from '@/todo/domain/use-cases/toggle-todo.use-case';
import { InMemoryTodoRepository } from '@test/helpers/in-memory-todo.repository';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';

describe('Use Case 시나리오 테스트 (Fake Repository)', () => {
  let repository: InMemoryTodoRepository;
  let createUseCase: CreateTodoUseCase;
  let getByIdUseCase: GetTodoByIdUseCase;
  let toggleUseCase: ToggleTodoUseCase;

  beforeEach(() => {
    repository = new InMemoryTodoRepository();
    createUseCase = new CreateTodoUseCase(repository);
    getByIdUseCase = new GetTodoByIdUseCase(repository);
    toggleUseCase = new ToggleTodoUseCase(repository);
  });

  it('Todo를 생성하고, 조회하고, 토글할 수 있다', async () => {
    // 1. 생성
    const created = await createUseCase.execute({ title: '장보기' });
    expect(created.id).toBe(1);
    expect(created.status).toBe(TODO_STATUS.PENDING);

    // 2. 조회
    const found = await getByIdUseCase.execute(1);
    expect(found.title).toBe('장보기');

    // 3. 토글 (PENDING → COMPLETED)
    const toggled = await toggleUseCase.execute(1);
    expect(toggled.status).toBe(TODO_STATUS.COMPLETED);

    // 4. 다시 토글 (COMPLETED → PENDING)
    const toggledBack = await toggleUseCase.execute(1);
    expect(toggledBack.status).toBe(TODO_STATUS.PENDING);
  });
});
