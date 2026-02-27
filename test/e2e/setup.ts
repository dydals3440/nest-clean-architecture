import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { PrismaClient } from '../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PRISMA_SERVICE } from '@/database/database.constants';

/**
 * E2E 테스트용 앱 인스턴스 생성 유틸리티
 *
 * 핵심 원칙:
 * 1. 프로덕션과 동일한 ValidationPipe 설정
 * 2. 테스트 전용 PostgreSQL DB를 사용하여 격리
 * 3. 모든 테스트 파일에서 동일한 방식으로 앱 생성
 */

// 테스트 전용 PostgreSQL 데이터베이스 생성
export function createTestDatabase() {
  // 테스트 전용 DB 연결 (환경변수 또는 직접 지정)
  const connectionString =
    process.env.TEST_DATABASE_URL ??
    'postgresql://user:password@localhost:5432/todo_test';

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  return { prisma };
}

// 테스트 앱 인스턴스 생성
export async function createTestApp(): Promise<{
  app: INestApplication;
  module: TestingModule;
  db: PrismaClient;
  cleanup: () => Promise<void>;
}> {
  const { prisma } = createTestDatabase();

  // NestJS 테스트 모듈 생성
  // AppModule 전체를 가져오되, DB 프로바이더만 교체
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PRISMA_SERVICE)
    .useValue(prisma)
    .compile();

  const app = moduleFixture.createNestApplication();

  // 프로덕션과 동일한 글로벌 프리픽스 설정 (main.ts와 일치)
  // 이 설정이 없으면 E2E 테스트에서 /api/todos 대신 /todos로 요청해야 함
  app.setGlobalPrefix('api');

  // 프로덕션과 동일한 글로벌 파이프 설정
  // 이것이 E2E 테스트의 핵심: 실제 환경과 동일한 설정
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 속성 제거
      transform: true, // 요청 데이터를 DTO 클래스 인스턴스로 변환
      forbidNonWhitelisted: true, // 정의되지 않은 속성이 있으면 에러
      transformOptions: {
        enableImplicitConversion: true, // 암묵적 타입 변환 허용
      },
    }),
  );

  await app.init();

  // 정리 함수
  const cleanup = async () => {
    await app.close();
    await prisma.$disconnect();
  };

  return { app, module: moduleFixture, db: prisma, cleanup };
}

// 테이블 데이터 초기화 (테스트 간 격리)
// TRUNCATE + RESTART IDENTITY로 매 테스트가 ID 1부터 시작하도록 보장
export async function clearDatabase(db: PrismaClient) {
  await db.$executeRawUnsafe('TRUNCATE TABLE "todos" RESTART IDENTITY CASCADE');
}
