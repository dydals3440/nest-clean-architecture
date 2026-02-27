// test/e2e/todo-errors.e2e-spec.ts

import { TestApp, createTestApp } from '../helpers/app.helper';
import { TodoApiHelper } from '../helpers/api.helper';
import { TodoFactory } from '../factories/todo.factory';
import {
  INVALID_TODO_NULL_TITLE,
  INVALID_TODO_NUMBER_TITLE,
  INVALID_TODO_LONG_TITLE,
  INVALID_TODO_LONG_DESCRIPTION,
} from '../fixtures/todo.fixture';

describe('Todo Error Cases E2E', () => {
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

  // ─────────────────────────────────────────────
  // 유효성 검증 실패 케이스
  // ─────────────────────────────────────────────

  describe('유효성 검증 실패', () => {
    describe('POST /api/todos - 생성 시 유효성 검증', () => {
      it('title이 누락되면 400과 에러 메시지를 반환한다', async () => {
        const response = await api.createTodoRaw({
          description: '설명만 있음',
        });

        expect(response.status).toBe(400);

        // supertest response.body는 any 타입이므로 suppress 필요
        /* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
        expect(response.body.statusCode).toBe(400);

        // class-validator의 에러 메시지 배열 확인
        expect(response.body.message).toBeInstanceOf(Array);
        expect(response.body.message.length).toBeGreaterThan(0);

        // 'title' 관련 에러 메시지가 포함되어 있는지
        const hasTitle = response.body.message.some(
          (msg: string) =>
            msg.toLowerCase().includes('title') || msg.includes('제목'),
        );
        expect(hasTitle).toBe(true);
        /* eslint-enable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */
      });

      it('title이 null이면 400을 반환한다', async () => {
        const response = await api.createTodoRaw(INVALID_TODO_NULL_TITLE);
        expect(response.status).toBe(400);
      });

      it('title이 숫자이면 문자열로 변환되어 201을 반환한다 (enableImplicitConversion)', async () => {
        // enableImplicitConversion: true로 인해 12345 → "12345"로 변환됨
        const response = await api.createTodoRaw(INVALID_TODO_NUMBER_TITLE);
        expect(response.status).toBe(201);
      });

      it('title이 boolean이면 문자열로 변환되어 201을 반환한다 (enableImplicitConversion)', async () => {
        // enableImplicitConversion: true로 인해 true → "true"로 변환됨
        const response = await api.createTodoRaw({ title: true });
        expect(response.status).toBe(201);
      });

      it('title이 배열이면 400을 반환한다', async () => {
        const response = await api.createTodoRaw({ title: ['a', 'b'] });
        expect(response.status).toBe(400);
      });

      it('title이 객체이면 문자열로 변환되어 201을 반환한다 (enableImplicitConversion)', async () => {
        // enableImplicitConversion: true로 인해 {value:'test'} → "[object Object]"로 변환됨
        const response = await api.createTodoRaw({ title: { value: 'test' } });
        expect(response.status).toBe(201);
      });

      it('title이 공백만으로 구성되면 400을 반환한다', async () => {
        const response = await api.createTodoRaw({ title: '   ' });
        expect(response.status).toBe(400);
      });

      it('title이 최대 길이를 초과하면 400을 반환한다', async () => {
        const response = await api.createTodoRaw(INVALID_TODO_LONG_TITLE);
        expect(response.status).toBe(400);
      });

      it('description이 최대 길이를 초과하면 400을 반환한다', async () => {
        const response = await api.createTodoRaw(INVALID_TODO_LONG_DESCRIPTION);
        expect(response.status).toBe(400);
      });

      it('허용되지 않은 필드가 여러 개 포함되면 각각 에러 메시지가 반환된다', async () => {
        const response = await api.createTodoRaw({
          title: '유효',
          hack: true,
          injection: 'DROP TABLE',
          extra: 123,
        });

        expect(response.status).toBe(400);
        // forbidNonWhitelisted에 의해 각 필드에 대한 에러
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(response.body.message.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('PATCH /api/todos/:id - 수정 시 유효성 검증', () => {
      let todoId: number;

      beforeEach(async () => {
        const todo = await api.createTodo(
          TodoFactory.createDto({ title: '수정 대상' }),
        );
        todoId = todo.id;
      });

      it('title을 빈 문자열로 수정하면 400을 반환한다', async () => {
        const response = await api.updateTodoRaw(todoId, { title: '' });
        expect(response.status).toBe(400);
      });

      it('title을 최대 길이 초과로 수정하면 400을 반환한다', async () => {
        const response = await api.updateTodoRaw(todoId, {
          title: 'a'.repeat(101),
        });
        expect(response.status).toBe(400);
      });

      it('허용되지 않은 필드를 포함하면 400을 반환한다', async () => {
        // UpdateTodoDto에 정의되지 않은 필드: forbidNonWhitelisted에 의해 거부
        const response = await api.updateTodoRaw(todoId, {
          unknownField: true,
        });
        expect(response.status).toBe(400);
      });
    });
  });

  // ─────────────────────────────────────────────
  // 404 응답 케이스
  // ─────────────────────────────────────────────

  describe('404 응답', () => {
    const nonExistentId = 99999;

    it('존재하지 않는 ID로 GET 요청하면 404를 반환한다', async () => {
      const response = await api.getTodoByIdRaw(nonExistentId);

      expect(response.status).toBe(404);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.statusCode).toBe(404);
    });

    it('존재하지 않는 ID로 PATCH 요청하면 404를 반환한다', async () => {
      const response = await api.updateTodoRaw(nonExistentId, {
        title: '수정',
      });
      expect(response.status).toBe(404);
    });

    it('존재하지 않는 ID로 DELETE 요청하면 404를 반환한다', async () => {
      const response = await api.deleteTodoRaw(nonExistentId);
      expect(response.status).toBe(404);
    });

    it('존재하지 않는 ID로 toggle 요청하면 404를 반환한다', async () => {
      const response = await api.toggleTodoRaw(nonExistentId);
      expect(response.status).toBe(404);
    });

    it('존재하지 않는 엔드포인트 접근 시 404를 반환한다', async () => {
      const response = await api.getTodoByIdRaw(
        'non-existent-endpoint' as unknown as number,
      );
      // ParseIntPipe에 의해 400 또는 NestJS 기본 404
      expect([400, 404]).toContain(response.status);
    });

    it('잘못된 ID 형식으로 요청하면 400을 반환한다', async () => {
      // ParseIntPipe에 의해 숫자가 아닌 값은 400 Bad Request
      const invalidIds = ['abc', 'not-a-number', '!@#$%'];

      for (const invalidId of invalidIds) {
        const response = await api.getTodoByIdRaw(invalidId);
        expect(response.status).toBe(400);
      }
    });
  });

  // ─────────────────────────────────────────────
  // 전체 흐름 시나리오 테스트
  // ─────────────────────────────────────────────

  describe('전체 흐름 시나리오', () => {
    it('생성 → 조회 → 수정 → 토글 → 삭제 → 조회(404) 전체 흐름', async () => {
      // Step 1: 생성
      const created = await api.createTodo({
        title: '전체 흐름 테스트',
        description: '처음부터 끝까지',
      });
      expect(created.title).toBe('전체 흐름 테스트');
      expect(created.status).toBe('PENDING');

      // Step 2: 단건 조회
      const fetched = await api.getTodoById(created.id);
      expect(fetched.title).toBe('전체 흐름 테스트');
      expect(fetched.description).toBe('처음부터 끝까지');

      // Step 3: 전체 조회에 포함되는지 확인
      const list = await api.getTodos();
      expect(list.data).toHaveLength(1);
      expect(list.data[0].id).toBe(created.id);

      // Step 4: title 수정
      const updated = await api.updateTodo(created.id, {
        title: '수정된 전체 흐름 테스트',
      });
      expect(updated.title).toBe('수정된 전체 흐름 테스트');
      expect(updated.description).toBe('처음부터 끝까지'); // 유지

      // Step 5: 완료 토글 (PENDING → COMPLETED)
      const toggled1 = await api.toggleTodo(created.id);
      expect(toggled1.status).toBe('COMPLETED');
      expect(toggled1.isCompleted).toBe(true);

      // Step 6: 한 번 더 토글 (COMPLETED → PENDING)
      const toggled2 = await api.toggleTodo(created.id);
      expect(toggled2.status).toBe('PENDING');

      // Step 7: 삭제
      await api.deleteTodo(created.id);

      // Step 8: 삭제 후 조회 → 404
      const deletedResponse = await api.getTodoByIdRaw(created.id);
      expect(deletedResponse.status).toBe(404);

      // Step 9: 전체 조회 시 빈 배열
      const emptyList = await api.getTodos();
      expect(emptyList.data).toHaveLength(0);
    });

    it('여러 Todo에 대한 독립적 CRUD 동작', async () => {
      // Step 1: 3개의 Todo 생성
      const dtos = TodoFactory.createManyDtos(3);
      const [todo1, todo2, todo3] = await api.createManyTodos(dtos);

      // Step 2: 전체 조회 → 3개
      let list = await api.getTodos();
      expect(list.data).toHaveLength(3);

      // Step 3: Todo 2만 완료 처리
      await api.toggleTodo(todo2.id);

      // Step 4: Todo 1 삭제
      await api.deleteTodo(todo1.id);

      // Step 5: 전체 조회 → 2개
      list = await api.getTodos();
      expect(list.data).toHaveLength(2);

      // Step 6: 남은 Todo 상태 확인
      const remainingTodo2 = list.data.find((t) => t.id === todo2.id);
      const remainingTodo3 = list.data.find((t) => t.id === todo3.id);

      expect(remainingTodo2?.status).toBe('COMPLETED');
      expect(remainingTodo3?.status).toBe('PENDING');

      // Step 7: Todo 3 수정
      const updated = await api.updateTodo(todo3.id, {
        title: 'Todo 3 수정됨',
      });
      expect(updated.title).toBe('Todo 3 수정됨');
    });

    it('동시성: 같은 Todo에 대한 연속적인 요청 처리', async () => {
      const todo = await api.createTodo(
        TodoFactory.createDto({ title: '동시성 테스트' }),
      );

      // 빠르게 연속으로 수정 요청
      const results = await Promise.all([
        api.updateTodoRaw(todo.id, { title: '수정 1' }),
        api.updateTodoRaw(todo.id, { title: '수정 2' }),
        api.updateTodoRaw(todo.id, { title: '수정 3' }),
      ]);

      // 모든 요청이 성공해야 함
      results.forEach((res) => {
        expect(res.status).toBe(200);
      });

      // 마지막 상태 확인 (어떤 수정이든 적용되어야 함)
      const final = await api.getTodoById(todo.id);
      expect(['수정 1', '수정 2', '수정 3']).toContain(final.title);
    });
  });
});
