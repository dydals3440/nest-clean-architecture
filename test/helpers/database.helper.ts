// test/helpers/database.helper.ts

import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * 테스트용 데이터베이스 헬퍼
 *
 * Part 3의 Prisma 스키마에 맞춰 테스트 전용 PostgreSQL을 설정합니다.
 *
 * Prisma 스키마 (schema.prisma):
 * - id: Int @id @default(autoincrement())
 * - title: String
 * - description: String?
 * - status: String @default("PENDING")
 * - createdAt: DateTime @default(now()) @map("created_at")
 * - updatedAt: DateTime @updatedAt @map("updated_at")
 */
export class TestDatabase {
  private prisma!: PrismaClient;

  /**
   * 테스트용 DB를 연결합니다.
   * PrismaPg 어댑터를 사용하여 PostgreSQL에 연결합니다.
   */
  setup(): PrismaClient {
    const adapter = new PrismaPg({
      connectionString:
        process.env.TEST_DATABASE_URL ??
        'postgresql://user:password@localhost:5432/todo_test',
    });
    this.prisma = new PrismaClient({ adapter });
    return this.prisma;
  }

  get db(): PrismaClient {
    return this.prisma;
  }

  /**
   * todos 테이블의 모든 데이터를 삭제하고 ID 시퀀스를 리셋합니다.
   * TRUNCATE + RESTART IDENTITY로 매 테스트가 ID 1부터 시작하도록 보장합니다.
   */
  async cleanup(): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "todos" RESTART IDENTITY CASCADE',
    );
  }

  /**
   * Prisma 연결을 종료합니다.
   */
  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

/**
 * 테스트용 데이터베이스를 생성하고 연결하는 팩토리 함수
 */
export function createTestDatabase(): TestDatabase {
  const testDb = new TestDatabase();
  testDb.setup();
  return testDb;
}
