import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 ValidationPipe 설정
  app.useGlobalPipes(
    new ValidationPipe({
      // DTO에 정의되지 않은 속성은 자동으로 제거
      whitelist: true,

      // DTO에 정의되지 않은 속성이 있으면 요청 거부 (400 에러)
      forbidNonWhitelisted: true,

      // 요청 본문을 DTO 클래스 인스턴스로 자동 변환
      transform: true,

      // 변환 시 암시적 타입 변환 활성화
      // 예: 쿼리 파라미터 "1" -> number 1
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API 경로 접두사 설정 (선택사항)
  // 모든 라우트가 /api/로 시작합니다: /api/todos, /api/users 등
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
