import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

/**
 * 애플리케이션 부트스트랩 함수
 *
 * NestJS 애플리케이션을 생성하고 시작합니다.
 *
 * 글로벌 설정(ValidationPipe, ExceptionFilter)은
 * AppModule에서 DI 시스템으로 등록했으므로
 * 여기서는 별도로 설정하지 않습니다.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  // NestJS 애플리케이션 인스턴스 생성
  const app = await NestFactory.create(AppModule, {
    /**
     * 로깅 레벨 설정
     * 개발 환경에서는 모든 레벨을, 프로덕션에서는 warn 이상만 출력할 수 있습니다.
     */
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  /**
   * API 접두사 설정
   *
   * 모든 라우트에 /api 접두사를 추가합니다.
   * /todos → /api/todos
   */
  app.setGlobalPrefix('api');

  /**
   * CORS 활성화
   *
   * 프론트엔드(다른 도메인)에서 API를 호출할 수 있도록 합니다.
   * 프로덕션에서는 허용 도메인을 제한해야 합니다.
   */
  app.enableCors();

  // 서버 시작
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`애플리케이션이 포트 ${port}에서 실행 중입니다.`);
  logger.log(`API URL: http://localhost:${port}/api`);
}

bootstrap();
