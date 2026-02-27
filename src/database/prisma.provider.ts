// src/database/prisma.provider.ts
import type { Provider } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PRISMA_SERVICE, DATABASE_OPTIONS } from './database.constants';
import type { DatabaseOptions } from './database-options.interface';
import { PrismaClient } from '@/generated/prisma/client';

/**
 * Prisma Provider 정의
 *
 * NestJS의 커스텀 Provider 패턴을 사용합니다.
 * - provide: DI 컨테이너에서 이 Provider를 식별하는 토큰
 * - useFactory: Provider 인스턴스를 생성하는 팩토리 함수
 * - inject: 팩토리 함수에 주입할 의존성 목록
 *
 * 이 Provider가 하는 일:
 * 1. PrismaPg 어댑터를 생성하여 PostgreSQL에 연결합니다.
 * 2. PrismaClient에 어댑터를 주입합니다.
 * 3. PrismaClient 인스턴스를 DI 컨테이너에 등록합니다.
 *
 * Prisma 7의 Driver Adapter 패턴:
 * - 기존의 Rust 기반 Query Engine이 제거되었습니다.
 * - Node.js 네이티브 PostgreSQL 드라이버(pg)를 직접 사용합니다.
 * - PrismaPg 어댑터가 pg 드라이버와 PrismaClient를 연결합니다.
 */
export const prismaProvider: Provider = {
  provide: PRISMA_SERVICE,
  useFactory: (options: DatabaseOptions): PrismaClient => {
    // 1. PrismaPg 어댑터 생성 (PostgreSQL 연결)
    const adapter = new PrismaPg({
      connectionString: options.url,
    });

    // 2. PrismaClient에 어댑터 주입
    const prisma = new PrismaClient({ adapter });

    return prisma;
  },
  inject: [DATABASE_OPTIONS],
};
