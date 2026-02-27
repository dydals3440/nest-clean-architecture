import type { Config } from 'jest';

const config: Config = {
  // TypeScript 파일을 Jest가 이해할 수 있도록 ts-jest 사용
  preset: 'ts-jest',

  // 테스트 실행 환경 (Node.js 환경)
  testEnvironment: 'node',

  // 소스 파일의 루트 디렉토리
  rootDir: '.',

  // TypeScript 경로 별칭 매핑
  // tsconfig.json의 paths와 동일하게 설정
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
  },

  // 커버리지 수집 대상
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts', // 진입점 제외
    '!src/**/*.module.ts', // 모듈 정의 제외
    '!src/**/index.ts', // 인덱스 파일 제외
    '!src/**/*.interface.ts', // 인터페이스 제외 (런타임 코드 없음)
    '!src/**/*.constants.ts', // 상수 제외
    '!src/generated/**', // Prisma 자동 생성 코드 제외
  ],

  // 커버리지 리포트 형식
  coverageReporters: ['text', 'text-summary', 'lcov', 'clover'],

  // 커버리지 디렉토리
  coverageDirectory: './coverage',

  // 최소 커버리지 기준 (선택사항)
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

export default config;
