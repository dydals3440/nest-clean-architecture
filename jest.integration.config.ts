import type { Config } from 'jest';
// @ts-expect-error Jest 30은 ESM 해석을 사용하므로 .ts 확장자 필요
import baseConfig from './jest.config.ts';

const config: Config = {
  ...baseConfig,

  displayName: 'integration',

  // 통합 테스트 파일 패턴
  testMatch: ['<rootDir>/test/integration/**/*.spec.ts'],

  // 통합 테스트는 DB 연동이 있으므로 타임아웃을 넉넉하게
  testTimeout: 30000,

  // 통합 테스트는 순차적으로 실행 (DB 상태 공유 방지)
  maxWorkers: 1,
};

export default config;
