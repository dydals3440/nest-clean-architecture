import { PrismaTodoRepository } from '@/todo/infrastructure/persistence/prisma-todo.repository';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import {
  TestDatabase,
  createTestDatabase,
} from '@test/helpers/database.helper';
import { TodoIntegrationFactory } from '@test/helpers/todo-integration.factory';

describe('PrismaTodoRepository (통합 테스트)', () => {
  let testDb: TestDatabase;
  let repository: PrismaTodoRepository;
  let factory: TodoIntegrationFactory;

  beforeAll(() => {
    testDb = createTestDatabase();
  });

  beforeEach(async () => {
    await testDb.cleanup();

    // PrismaTodoRepository는 @Inject(PRISMA_SERVICE)로 PrismaClient를 주입받지만,
    // 테스트에서는 직접 생성하여 testDb.db(PrismaClient)를 전달합니다.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    repository = new (PrismaTodoRepository as any)(testDb.db);
    factory = new TodoIntegrationFactory(testDb.db);
  });

  afterAll(async () => {
    await testDb.close();
  });

  // ─── save() ───

  describe('save', () => {
    it('새로운 Todo를 저장하고 ID가 할당된다', async () => {
      const todo = Todo.create('장보기', '우유, 빵 사기');

      const saved = await repository.save(todo);

      expect(saved.id).toBe(1);
      expect(saved.title).toBe('장보기');
      expect(saved.description).toBe('우유, 빵 사기');
      expect(saved.status).toBe(TODO_STATUS.PENDING);
    });

    it('여러 Todo를 저장하면 ID가 자동 증가한다', async () => {
      const todo1 = Todo.create('할 일 1');
      const todo2 = Todo.create('할 일 2');

      const saved1 = await repository.save(todo1);
      const saved2 = await repository.save(todo2);

      expect(saved1.id).toBe(1);
      expect(saved2.id).toBe(2);
    });

    it('저장된 Todo는 도메인 엔티티로 올바르게 변환된다', async () => {
      const todo = Todo.create('장보기');

      const saved = await repository.save(todo);

      expect(saved).toBeInstanceOf(Todo);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });
  });

  // ─── findById() ───

  describe('findById', () => {
    it('존재하는 ID로 Todo를 조회할 수 있다', async () => {
      const { id } = await factory.insertTodo({
        title: '장보기',
        description: '우유 사기',
        status: 'IN_PROGRESS',
      });

      const found = await repository.findById(id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(id);
      expect(found!.title).toBe('장보기');
      expect(found!.description).toBe('우유 사기');
      expect(found!.status).toBe(TODO_STATUS.IN_PROGRESS);
    });

    it('존재하지 않는 ID면 null을 반환한다', async () => {
      const found = await repository.findById(999);

      expect(found).toBeNull();
    });

    it('반환된 Todo는 도메인 엔티티 인스턴스다', async () => {
      const { id } = await factory.insertTodo({ title: '장보기' });

      const found = await repository.findById(id);

      expect(found).toBeInstanceOf(Todo);
    });
  });

  // ─── findAll() ───

  describe('findAll', () => {
    it('모든 Todo를 페이지네이션하여 조회한다', async () => {
      await factory.insertMany(3);

      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('페이지네이션이 동작한다 (2페이지)', async () => {
      await factory.insertMany(5);

      const result = await repository.findAll({ page: 2, limit: 2 });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.page).toBe(2);
      expect(result.totalPages).toBe(3); // ceil(5/2) = 3
    });

    it('상태로 필터링할 수 있다', async () => {
      await factory.insertTodo({ title: '할 일 1', status: 'PENDING' });
      await factory.insertTodo({ title: '할 일 2', status: 'COMPLETED' });
      await factory.insertTodo({ title: '할 일 3', status: 'PENDING' });

      const result = await repository.findAll(
        { page: 1, limit: 10 },
        { status: TODO_STATUS.PENDING },
      );

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      result.data.forEach((todo) => {
        expect(todo.status).toBe(TODO_STATUS.PENDING);
      });
    });

    it('제목으로 검색할 수 있다', async () => {
      await factory.insertTodo({ title: '장보기' });
      await factory.insertTodo({ title: '운동하기' });
      await factory.insertTodo({ title: '장보기 목록 정리' });

      const result = await repository.findAll(
        { page: 1, limit: 10 },
        { titleSearch: '장보기' },
      );

      expect(result.data).toHaveLength(2);
    });

    it('데이터가 없으면 빈 배열을 반환한다', async () => {
      const result = await repository.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // ─── findByStatus() ───

  describe('findByStatus', () => {
    it('특정 상태의 Todo만 조회한다', async () => {
      await factory.insertTodo({ status: 'PENDING' });
      await factory.insertTodo({ status: 'COMPLETED' });
      await factory.insertTodo({ status: 'PENDING' });

      const result = await repository.findByStatus(TODO_STATUS.PENDING);

      expect(result).toHaveLength(2);
    });
  });

  // ─── update() ───

  describe('update', () => {
    it('Todo의 제목을 업데이트할 수 있다', async () => {
      const saved = await repository.save(Todo.create('장보기'));
      saved.updateTitle('마트 장보기');

      const updated = await repository.update(saved);

      expect(updated.title).toBe('마트 장보기');

      // DB에서 다시 조회해도 반영되어 있는지 확인
      const found = await repository.findById(saved.id!);
      expect(found!.title).toBe('마트 장보기');
    });

    it('Todo의 상태를 업데이트할 수 있다', async () => {
      const saved = await repository.save(Todo.create('장보기'));
      saved.changeStatus(TODO_STATUS.IN_PROGRESS);

      const updated = await repository.update(saved);

      expect(updated.status).toBe(TODO_STATUS.IN_PROGRESS);
    });
  });

  // ─── delete() ───

  describe('delete', () => {
    it('Todo를 삭제할 수 있다', async () => {
      const saved = await repository.save(Todo.create('장보기'));

      await repository.delete(saved.id!);

      const found = await repository.findById(saved.id!);
      expect(found).toBeNull();
    });

    it('삭제 후 전체 수가 감소한다', async () => {
      const saved1 = await repository.save(Todo.create('할 일 1'));
      await repository.save(Todo.create('할 일 2'));

      await repository.delete(saved1.id!);

      const count = await repository.count();
      expect(count).toBe(1);
    });
  });

  // ─── count() ───

  describe('count', () => {
    it('전체 Todo 수를 반환한다', async () => {
      await factory.insertMany(5);

      const count = await repository.count();

      expect(count).toBe(5);
    });

    it('필터 조건에 맞는 수만 반환한다', async () => {
      await factory.insertTodo({ status: 'PENDING' });
      await factory.insertTodo({ status: 'COMPLETED' });
      await factory.insertTodo({ status: 'PENDING' });

      const count = await repository.count({ status: TODO_STATUS.PENDING });

      expect(count).toBe(2);
    });

    it('데이터가 없으면 0을 반환한다', async () => {
      const count = await repository.count();

      expect(count).toBe(0);
    });
  });
});
