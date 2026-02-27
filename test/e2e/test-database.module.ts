// test/e2e/test-database.module.ts

import { Module, Global } from '@nestjs/common';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PRISMA_SERVICE } from '@/database/database.constants';

@Global()
@Module({
  providers: [
    {
      provide: PRISMA_SERVICE,
      useFactory: () => {
        const connectionString =
          process.env.TEST_DATABASE_URL ??
          'postgresql://user:password@localhost:5432/todo_test';

        const adapter = new PrismaPg({ connectionString });
        const prisma = new PrismaClient({ adapter });

        // DB 스키마가 최신인지 확인 (prisma db push를 사전에 실행해야 함)
        return prisma;
      },
    },
  ],
  exports: [PRISMA_SERVICE],
})
export class TestDatabaseModule {}
