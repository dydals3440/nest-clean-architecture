import { CreateTodoUseCase } from '@/todo/domain/use-cases/create-todo.use-case';
import { GetTodoByIdUseCase } from '@/todo/domain/use-cases/get-todo-by-id.use-case';
import { GetTodosUseCase } from '@/todo/domain/use-cases/get-todos.use-case';
import { UpdateTodoUseCase } from '@/todo/domain/use-cases/update-todo.use-case';
import { DeleteTodoUseCase } from '@/todo/domain/use-cases/delete-todo.use-case';
import { ToggleTodoUseCase } from '@/todo/domain/use-cases/toggle-todo.use-case';
import { PrismaTodoRepository } from '@/todo/infrastructure/persistence/prisma-todo.repository';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';
import { InvalidStatusTransitionError } from '@/todo/domain/errors/invalid-status-transition.error';
import {
  TestDatabase,
  createTestDatabase,
} from '@test/helpers/database.helper';

describe('Use Case + Repository 통합 테스트', () => {
  let testDb: TestDatabase;
  let repository: PrismaTodoRepository;

  // Use Cases
  let createTodo: CreateTodoUseCase;
  let getTodoById: GetTodoByIdUseCase;
  let getTodos: GetTodosUseCase;
  let updateTodo: UpdateTodoUseCase;
  let deleteTodo: DeleteTodoUseCase;
  let toggleTodo: ToggleTodoUseCase;

  beforeAll(() => {
    testDb = createTestDatabase();
  });

  beforeEach(async () => {
    await testDb.cleanup();

    // PrismaTodoRepository는 @Inject(PRISMA_SERVICE)로 PrismaClient를 주입받지만,
    // 테스트에서는 직접 생성하여 testDb.db(PrismaClient)를 전달합니다.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    repository = new (PrismaTodoRepository as any)(testDb.db);
    createTodo = new CreateTodoUseCase(repository);
    getTodoById = new GetTodoByIdUseCase(repository);
    getTodos = new GetTodosUseCase(repository);
    updateTodo = new UpdateTodoUseCase(repository);
    deleteTodo = new DeleteTodoUseCase(repository);
    toggleTodo = new ToggleTodoUseCase(repository);
  });

  afterAll(async () => {
    await testDb.close();
  });

  // ─── 생성 + 조회 ───

  describe('생성 + 조회', () => {
    it('Todo를 생성하고 ID로 조회할 수 있다', async () => {
      const created = await createTodo.execute({
        title: '장보기',
        description: '우유, 빵 사기',
      });

      const found = await getTodoById.execute(created.id!);

      expect(found.id).toBe(created.id);
      expect(found.title).toBe('장보기');
      expect(found.description).toBe('우유, 빵 사기');
      expect(found.status).toBe(TODO_STATUS.PENDING);
    });

    it('여러 Todo를 생성하고 목록으로 조회할 수 있다', async () => {
      await createTodo.execute({ title: '할 일 1' });
      await createTodo.execute({ title: '할 일 2' });
      await createTodo.execute({ title: '할 일 3' });

      const result = await getTodos.execute({
        pagination: { page: 1, limit: 10 },
      });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  // ─── 수정 ───

  describe('수정', () => {
    it('Todo 제목을 변경하고 DB에서 확인한다', async () => {
      const created = await createTodo.execute({ title: '장보기' });

      const updated = await updateTodo.execute({
        id: created.id!,
        title: '마트 장보기',
      });

      expect(updated.title).toBe('마트 장보기');

      // DB에서 직접 조회하여 확인
      const found = await getTodoById.execute(created.id!);
      expect(found.title).toBe('마트 장보기');
    });

    it('Todo 상태를 변경할 수 있다', async () => {
      const created = await createTodo.execute({ title: '장보기' });

      const updated = await updateTodo.execute({
        id: created.id!,
        status: TODO_STATUS.IN_PROGRESS,
      });

      expect(updated.status).toBe(TODO_STATUS.IN_PROGRESS);
    });

    it('존재하지 않는 Todo를 수정하면 에러가 발생한다', async () => {
      await expect(
        updateTodo.execute({ id: 999, title: '새 제목' }),
      ).rejects.toThrow(TodoNotFoundError);
    });

    it('유효하지 않은 제목으로 수정하면 에러가 발생한다', async () => {
      const created = await createTodo.execute({ title: '장보기' });

      await expect(
        updateTodo.execute({ id: created.id!, title: '' }),
      ).rejects.toThrow(InvalidTodoTitleError);

      // 에러 발생 후 원본 데이터가 변경되지 않았는지 확인
      const found = await getTodoById.execute(created.id!);
      expect(found.title).toBe('장보기');
    });

    it('허용되지 않는 상태 전이는 에러가 발생한다', async () => {
      const created = await createTodo.execute({ title: '장보기' });

      // PENDING → COMPLETED
      await updateTodo.execute({
        id: created.id!,
        status: TODO_STATUS.COMPLETED,
      });

      // COMPLETED → IN_PROGRESS (불허)
      await expect(
        updateTodo.execute({
          id: created.id!,
          status: TODO_STATUS.IN_PROGRESS,
        }),
      ).rejects.toThrow(InvalidStatusTransitionError);
    });
  });

  // ─── 삭제 ───

  describe('삭제', () => {
    it('Todo를 삭제하면 더 이상 조회할 수 없다', async () => {
      const created = await createTodo.execute({ title: '장보기' });

      await deleteTodo.execute(created.id!);

      await expect(getTodoById.execute(created.id!)).rejects.toThrow(
        TodoNotFoundError,
      );
    });

    it('존재하지 않는 Todo를 삭제하면 에러가 발생한다', async () => {
      await expect(deleteTodo.execute(999)).rejects.toThrow(TodoNotFoundError);
    });
  });

  // ─── 토글 ───

  describe('토글', () => {
    it('PENDING → COMPLETED → PENDING 순환이 동작한다', async () => {
      const created = await createTodo.execute({ title: '장보기' });
      expect(created.status).toBe(TODO_STATUS.PENDING);

      // 첫 번째 토글: PENDING → COMPLETED
      const toggled1 = await toggleTodo.execute(created.id!);
      expect(toggled1.status).toBe(TODO_STATUS.COMPLETED);

      // 두 번째 토글: COMPLETED → PENDING
      const toggled2 = await toggleTodo.execute(created.id!);
      expect(toggled2.status).toBe(TODO_STATUS.PENDING);
    });
  });

  // ─── 전체 워크플로우 ───

  describe('전체 워크플로우', () => {
    it('Todo 생명주기: 생성 → 수정 → 완료 → 삭제', async () => {
      // 1. 생성
      const created = await createTodo.execute({
        title: '장보기',
        description: '우유 사기',
      });
      expect(created.status).toBe(TODO_STATUS.PENDING);

      // 2. 제목 수정
      const updated = await updateTodo.execute({
        id: created.id!,
        title: '마트 장보기',
      });
      expect(updated.title).toBe('마트 장보기');

      // 3. 진행 중으로 변경
      await updateTodo.execute({
        id: created.id!,
        status: TODO_STATUS.IN_PROGRESS,
      });

      // 4. 완료
      const toggled = await toggleTodo.execute(created.id!);
      expect(toggled.status).toBe(TODO_STATUS.COMPLETED);

      // 5. 삭제
      await deleteTodo.execute(created.id!);

      // 6. 삭제 확인
      await expect(getTodoById.execute(created.id!)).rejects.toThrow(
        TodoNotFoundError,
      );
    });
  });
});
