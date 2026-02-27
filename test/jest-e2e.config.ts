// test/jest-e2e.config.ts

import type { Config } from 'jest';

const config: Config = {
  // E2E 테스트 파일 위치
  rootDir: '..',
  testRegex: '.e2e-spec.ts$',

  // TypeScript 변환
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // 모듈 경로 매핑 (tsconfig의 paths와 일치)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@application/(.*)$': '<rootDir>/src/application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
  },

  // Node 환경 사용
  testEnvironment: 'node',

  // 타임아웃 설정 (E2E는 더 오래 걸릴 수 있음)
  testTimeout: 30000,

  // 테스트 전 전역 설정
  setupFilesAfterEnv: ['<rootDir>/test/e2e/setup.ts'],

  // 커버리지 설정 (E2E는 별도 관리)
  collectCoverage: false,

  // 순서대로 실행 (병렬 실행 시 DB 충돌 방지)
  maxWorkers: 1,

  // Prisma 커넥션 풀 종료 대기 방지
  forceExit: true,
};

export default config;
