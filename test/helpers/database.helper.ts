// test/helpers/database.helper.ts
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';

/**
 * 테스트용 데이터베이스 헬퍼
 *
 * 각 테스트(또는 테스트 스위트)마다 독립적인 테스트 전용 PostgreSQL 데이터베이스를
 * 생성하고 관리합니다.
 *
 * 테스트 전용 DB를 사용하는 이유:
 * 1. 각 테스트가 깨끗한 상태에서 시작합니다.
 * 2. 프로덕션 DB와 격리되어 안전합니다.
 * 3. 테스트 종료 후 데이터를 정리할 수 있습니다.
 */
export class TestDatabase {
  private _prisma: PrismaClient;

  constructor() {
    // 테스트 전용 PostgreSQL 데이터베이스에 연결
    const adapter = new PrismaPg({
      connectionString:
        'postgresql://user:password@localhost:5432/todo_test',
    });
    this._prisma = new PrismaClient({ adapter });
  }

  /**
   * PrismaClient 인스턴스를 반환합니다.
   * 리포지토리나 서비스에 주입할 때 사용합니다.
   */
  get db(): PrismaClient {
    return this._prisma;
  }

  /**
   * 테이블을 생성합니다.
   * 각 테스트 시작 전에 호출하여 스키마를 설정합니다.
   *
   * prisma db push로 테스트 DB에 스키마를 반영하거나,
   * prisma migrate deploy로 마이그레이션을 실행합니다.
   */
  async setup(): Promise<void> {
    // PrismaClient 연결 초기화
    await this._prisma.$connect();
  }

  /**
   * 모든 테이블의 데이터를 삭제합니다.
   * 각 테스트 후에 호출하여 데이터를 정리합니다.
   */
  async cleanup(): Promise<void> {
    await this._prisma.todo.deleteMany();
  }

  /**
   * 데이터베이스 연결을 종료합니다.
   * 테스트 스위트 종료 시 호출합니다.
   */
  async close(): Promise<void> {
    await this._prisma.$disconnect();
  }
}

/**
 * 테스트용 데이터베이스를 생성하고 설정하는 팩토리 함수
 *
 * @example
 * describe('MyRepository', () => {
 *   let testDb: TestDatabase;
 *
 *   beforeAll(async () => {
 *     testDb = await createTestDatabase();
 *   });
 *
 *   afterEach(async () => {
 *     await testDb.cleanup();
 *   });
 *
 *   afterAll(async () => {
 *     await testDb.close();
 *   });
 *
 *   it('should save todo', () => {
 *     const repository = new PrismaTodoRepository(testDb.db);
 *     // ...
 *   });
 * });
 */
export async function createTestDatabase(): Promise<TestDatabase> {
  const testDb = new TestDatabase();
  await testDb.setup();
  return testDb;
}
