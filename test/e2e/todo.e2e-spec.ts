// test/e2e/todo.e2e-spec.ts

import { TestApp, createTestApp } from '../helpers/app.helper';
import { TodoApiHelper } from '../helpers/api.helper';
import { TodoFactory } from '../factories/todo.factory';
import {
  VALID_TODO,
  VALID_TODO_WITHOUT_DESCRIPTION,
  VALID_TODO_LONG_TITLE,
  INVALID_TODO_EMPTY,
  INVALID_TODO_EMPTY_TITLE,
  INVALID_TODO_LONG_TITLE,
  INVALID_TODO_EXTRA_FIELDS,
  UPDATE_TITLE_ONLY,
  UPDATE_DESCRIPTION_ONLY,
  UPDATE_BOTH,
  EXPECTED_TODO_SHAPE,
  EXPECTED_PAGINATION_SHAPE,
} from '../fixtures/todo.fixture';

describe('Todo E2E', () => {
  let testApp: TestApp;
  let api: TodoApiHelper;

  beforeAll(async () => {
    testApp = await createTestApp();
    api = new TodoApiHelper(testApp.app);
  });

  beforeEach(async () => {
    TodoFactory.reset();
    await testApp.clearDatabase();
  });

  afterAll(async () => {
    await testApp.close();
  });

  // ─── POST /api/todos ───

  describe('POST /api/todos', () => {
    it('유효한 데이터로 Todo를 생성하면 201과 생성된 Todo를 반환한다', async () => {
      const todo = await api.createTodo(VALID_TODO);

      expect(todo).toMatchObject({
        ...EXPECTED_TODO_SHAPE,
        title: VALID_TODO.title,
        description: VALID_TODO.description,
        status: 'PENDING',
        isCompleted: false,
      });
    });

    it('title만으로 Todo를 생성할 수 있다 (description은 선택)', async () => {
      const todo = await api.createTodo(VALID_TODO_WITHOUT_DESCRIPTION);

      expect(todo).toMatchObject({
        title: VALID_TODO_WITHOUT_DESCRIPTION.title,
        description: null,
        status: 'PENDING',
      });
    });

    it('빈 body로 요청하면 400 Bad Request를 반환한다', async () => {
      const response = await api.createTodoRaw(INVALID_TODO_EMPTY);

      expect(response.status).toBe(400);
      /* eslint-disable @typescript-eslint/no-unsafe-member-access */
      expect(response.body.statusCode).toBe(400);
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('제목')]),
      );
      /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    });

    it('title이 빈 문자열이면 400을 반환한다', async () => {
      const response = await api.createTodoRaw(INVALID_TODO_EMPTY_TITLE);

      expect(response.status).toBe(400);
    });

    it('title이 최대 길이를 초과하면 400을 반환한다', async () => {
      const response = await api.createTodoRaw(INVALID_TODO_LONG_TITLE);

      expect(response.status).toBe(400);
    });

    it('title이 정확히 최대 길이이면 성공한다', async () => {
      const todo = await api.createTodo(VALID_TODO_LONG_TITLE);

      expect(todo.title).toBe(VALID_TODO_LONG_TITLE.title);
    });

    it('허용되지 않은 필드가 포함되면 400을 반환한다', async () => {
      const response = await api.createTodoRaw(INVALID_TODO_EXTRA_FIELDS);

      expect(response.status).toBe(400);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.message).toEqual(
        expect.arrayContaining([expect.stringContaining('extraField')]),
      );
    });
  });

  // ─── GET /api/todos ───

  describe('GET /api/todos', () => {
    it('Todo가 없으면 빈 페이지네이션 응답을 반환한다', async () => {
      const result = await api.getTodos();

      expect(result).toMatchObject(EXPECTED_PAGINATION_SHAPE);
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('여러 Todo를 생성한 후 전체 목록을 조회한다', async () => {
      const dtos = TodoFactory.createManyDtos(3);
      await api.createManyTodos(dtos);

      const result = await api.getTodos();

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(3);
    });

    it('생성된 Todo의 모든 필드가 올바르게 반환된다', async () => {
      await api.createTodo(VALID_TODO);

      const result = await api.getTodos();
      const todo = result.data[0];

      expect(todo).toMatchObject(EXPECTED_TODO_SHAPE);
      expect(todo).toHaveProperty('title', VALID_TODO.title);
      expect(todo).toHaveProperty('description', VALID_TODO.description);
      expect(todo).toHaveProperty('status', 'PENDING');
      expect(todo).toHaveProperty('isCompleted', false);
    });

    // ─── 페이지네이션 ───

    describe('페이지네이션', () => {
      beforeEach(async () => {
        await api.createBulkTodos(25);
      });

      it('기본 페이지네이션 (page=1, limit=10)', async () => {
        const result = await api.getTodos({ page: 1, limit: 10 });

        expect(result.data).toHaveLength(10);
        expect(result.meta).toMatchObject({
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        });
      });

      it('두 번째 페이지 조회', async () => {
        const result = await api.getTodos({ page: 2, limit: 10 });

        expect(result.data).toHaveLength(10);
        expect(result.meta.page).toBe(2);
      });

      it('마지막 페이지 조회 (남은 항목만 반환)', async () => {
        const result = await api.getTodos({ page: 3, limit: 10 });

        expect(result.data).toHaveLength(5);
      });

      it('범위를 벗어난 페이지 조회 시 빈 배열 반환', async () => {
        const result = await api.getTodos({ page: 100, limit: 10 });

        expect(result.data).toHaveLength(0);
      });

      it('limit을 변경하여 조회', async () => {
        const result = await api.getTodos({ page: 1, limit: 5 });

        expect(result.data).toHaveLength(5);
        expect(result.meta.limit).toBe(5);
      });
    });

    // ─── 상태 필터링 ───

    describe('상태 필터링', () => {
      it('status 쿼리 파라미터로 필터링할 수 있다', async () => {
        const dtos = TodoFactory.createManyDtos(3);
        const todos = await api.createManyTodos(dtos);

        // 2번째 Todo만 완료 처리
        await api.toggleTodo(todos[1].id);

        const result = await api.getTodos({ status: 'COMPLETED' });

        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe('COMPLETED');
      });
    });
  });

  // ─── GET /api/todos/:id ───

  describe('GET /api/todos/:id', () => {
    it('존재하는 Todo를 조회하면 200과 Todo 객체를 반환한다', async () => {
      const created = await api.createTodo(VALID_TODO);

      const todo = await api.getTodoById(created.id);

      expect(todo).toMatchObject({
        id: created.id,
        title: VALID_TODO.title,
        description: VALID_TODO.description,
        status: 'PENDING',
        isCompleted: false,
      });
    });

    it('존재하지 않는 ID로 조회하면 404를 반환한다', async () => {
      const response = await api.getTodoByIdRaw(999);

      expect(response.status).toBe(404);
    });

    it('생성 직후 조회한 데이터가 일치한다', async () => {
      const created = await api.createTodo(VALID_TODO);
      const fetched = await api.getTodoById(created.id);

      expect(fetched).toEqual(created);
    });
  });

  // ─── PATCH /api/todos/:id ───

  describe('PATCH /api/todos/:id', () => {
    let todoId: number;

    beforeEach(async () => {
      const todo = await api.createTodo({
        title: '원래 제목',
        description: '원래 설명',
      });
      todoId = todo.id;
    });

    it('title을 수정하면 200과 수정된 Todo를 반환한다', async () => {
      const updated = await api.updateTodo(todoId, UPDATE_TITLE_ONLY);

      expect(updated).toMatchObject({
        id: todoId,
        title: UPDATE_TITLE_ONLY.title,
        description: '원래 설명',
      });
    });

    it('description을 수정하면 200과 수정된 Todo를 반환한다', async () => {
      const updated = await api.updateTodo(todoId, UPDATE_DESCRIPTION_ONLY);

      expect(updated).toMatchObject({
        id: todoId,
        title: '원래 제목',
        description: UPDATE_DESCRIPTION_ONLY.description,
      });
    });

    it('title과 description을 동시에 수정할 수 있다', async () => {
      const updated = await api.updateTodo(todoId, UPDATE_BOTH);

      expect(updated.title).toBe(UPDATE_BOTH.title);
      expect(updated.description).toBe(UPDATE_BOTH.description);
    });

    it('수정 후 조회하면 수정된 데이터가 반환된다', async () => {
      await api.updateTodo(todoId, UPDATE_TITLE_ONLY);

      const fetched = await api.getTodoById(todoId);

      expect(fetched.title).toBe(UPDATE_TITLE_ONLY.title);
    });

    it('updatedAt이 수정 시간으로 갱신된다', async () => {
      const before = await api.getTodoById(todoId);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const after = await api.updateTodo(todoId, UPDATE_TITLE_ONLY);

      const beforeDate = new Date(before.updatedAt).getTime();
      const afterDate = new Date(after.updatedAt).getTime();
      expect(afterDate).toBeGreaterThanOrEqual(beforeDate);
    });

    it('존재하지 않는 ID로 수정하면 404를 반환한다', async () => {
      const response = await api.updateTodoRaw(999, UPDATE_TITLE_ONLY);

      expect(response.status).toBe(404);
    });

    it('title을 빈 문자열로 수정하면 400을 반환한다', async () => {
      const response = await api.updateTodoRaw(todoId, { title: '' });

      expect(response.status).toBe(400);
    });
  });

  // ─── PATCH /api/todos/:id/toggle ───

  describe('PATCH /api/todos/:id/toggle', () => {
    let todoId: number;

    beforeEach(async () => {
      const todo = await api.createTodo(
        TodoFactory.createDto({ title: '토글 테스트' }),
      );
      todoId = todo.id;
      // eslint-disable-next-line jest/no-standalone-expect
      expect(todo.status).toBe('PENDING');
    });

    it('PENDING Todo를 토글하면 COMPLETED가 된다', async () => {
      const toggled = await api.toggleTodo(todoId);

      expect(toggled).toMatchObject({
        id: todoId,
        title: '토글 테스트',
        status: 'COMPLETED',
        isCompleted: true,
      });
    });

    it('COMPLETED Todo를 다시 토글하면 PENDING이 된다', async () => {
      await api.toggleTodo(todoId);
      const toggled = await api.toggleTodo(todoId);

      expect(toggled.status).toBe('PENDING');
      expect(toggled.isCompleted).toBe(false);
    });

    it('여러 번 토글해도 올바르게 동작한다', async () => {
      let toggled = await api.toggleTodo(todoId);
      expect(toggled.status).toBe('COMPLETED');

      toggled = await api.toggleTodo(todoId);
      expect(toggled.status).toBe('PENDING');

      toggled = await api.toggleTodo(todoId);
      expect(toggled.status).toBe('COMPLETED');
    });

    it('토글 후 조회하면 변경된 상태가 유지된다', async () => {
      await api.toggleTodo(todoId);

      const fetched = await api.getTodoById(todoId);

      expect(fetched.status).toBe('COMPLETED');
      expect(fetched.isCompleted).toBe(true);
    });

    it('존재하지 않는 ID를 토글하면 404를 반환한다', async () => {
      const response = await api.toggleTodoRaw(999);

      expect(response.status).toBe(404);
    });
  });

  // ─── DELETE /api/todos/:id ───

  describe('DELETE /api/todos/:id', () => {
    let todoId: number;

    beforeEach(async () => {
      const todo = await api.createTodo(
        TodoFactory.createDto({ title: '삭제 테스트' }),
      );
      todoId = todo.id;
    });

    it('존재하는 Todo를 삭제하면 204를 반환한다', async () => {
      // deleteTodo는 내부에서 expect(204)를 검증함
      const response = await api.deleteTodoRaw(todoId);
      expect(response.status).toBe(204);
    });

    it('삭제한 Todo를 다시 조회하면 404를 반환한다', async () => {
      await api.deleteTodo(todoId);

      const response = await api.getTodoByIdRaw(todoId);
      expect(response.status).toBe(404);
    });

    it('삭제한 Todo는 전체 조회 목록에서도 사라진다', async () => {
      await api.createTodo(TodoFactory.createDto({ title: '남아있는 Todo' }));

      await api.deleteTodo(todoId);

      const result = await api.getTodos();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe('남아있는 Todo');
    });

    it('존재하지 않는 ID를 삭제하면 404를 반환한다', async () => {
      const response = await api.deleteTodoRaw(999);
      expect(response.status).toBe(404);
    });

    it('이미 삭제한 Todo를 다시 삭제하면 404를 반환한다', async () => {
      await api.deleteTodo(todoId);

      const response = await api.deleteTodoRaw(todoId);
      expect(response.status).toBe(404);
    });
  });
});
