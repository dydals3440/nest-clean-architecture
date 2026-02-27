import { PRISMA_SERVICE } from '@/database/database.constants';

// test/unit/setup.spec.ts
describe('Test Setup', () => {
  it('Jest가 정상적으로 실행됩니다', () => {
    expect(true).toBe(true);
  });

  it('TypeScript 경로 별칭이 올바르게 해석됩니다', () => {
    expect(PRISMA_SERVICE).toBeDefined();
    expect(typeof PRISMA_SERVICE).toBe('symbol');
  });
});
