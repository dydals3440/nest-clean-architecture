// src/database/database.constants.ts

/**
 * Prisma ORM 인스턴스를 DI 컨테이너에서 식별하기 위한 토큰입니다.
 *
 * NestJS의 DI 시스템에서는 클래스가 아닌 값(예: Prisma 인스턴스)을
 * 주입할 때 문자열 또는 Symbol 토큰이 필요합니다.
 *
 * 사용 예:
 * - Provider 등록: { provide: PRISMA_SERVICE, useFactory: ... }
 * - 주입: @Inject(PRISMA_SERVICE) private readonly db: PrismaClient
 */
export const PRISMA_SERVICE = Symbol('PRISMA_SERVICE');

/**
 * 데이터베이스 옵션을 DI 컨테이너에서 식별하기 위한 토큰입니다.
 */
export const DATABASE_OPTIONS = Symbol('DATABASE_OPTIONS');
