import {
  createTestDatabase,
  TestDatabase,
} from '@test/helpers/database.helper';

describe('Test Database Setup', () => {
  let testDb: TestDatabase;

  beforeAll(() => {
    testDb = createTestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
  });

  it('테스트 데이터베이스가 정상적으로 생성됩니다', () => {
    expect(testDb.db).toBeDefined();
  });

  it('todos 테이블에 데이터를 삽입할 수 있습니다', async () => {
    // PrismaClient를 통해 테이블에 접근하여 동작 확인
    const todo = await testDb.db.todo.create({
      data: { title: '테스트 할 일' },
    });
    expect(todo).toBeDefined();
    expect(todo.title).toBe('테스트 할 일');

    // 정리
    await testDb.cleanup();
  });
});
