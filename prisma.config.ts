import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  // Prisma 스키마 파일 경로
  schema: 'prisma/schema.prisma',

  // 마이그레이션 설정
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },

  // 데이터베이스 연결 정보
  datasource: {
    url: env('DATABASE_URL'),
  },
});
