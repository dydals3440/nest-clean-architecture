import type { Config } from 'jest';
// @ts-expect-error Jest 30은 ESM 해석을 사용하므로 .ts 확장자 필요
import baseConfig from './jest.config.ts';

const config: Config = {
  ...baseConfig,

  // 이 설정의 표시 이름 (테스트 실행 시 구분용)
  displayName: 'unit',

  // 유닛 테스트 파일 패턴
  // test/unit/ 디렉토리의 .spec.ts 파일만 실행
  testMatch: ['<rootDir>/test/unit/**/*.spec.ts'],

  // 유닛 테스트는 매우 빠르게 실행되어야 합니다
  // 각 테스트 파일의 타임아웃: 10초
  testTimeout: 10000,
};

export default config;

// 유닛 테스트를 별도 설정으로 분리하는 이유
// - 유닛 테스트만 빠르게 실행 가능.
// - 유닛 테스트와 통합 테스트의 타임아웃을 다르게 설정할 수 있다.
// CI/CD 파이프라인에서 테스트 단계를 분리할 수 있다. (유닛 테스트 실패 시 통합 테스트 실행하지 않음)
