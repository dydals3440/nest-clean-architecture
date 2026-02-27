import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { DatabaseModule } from '@/database';

/**
 * 테스트용 NestJS 애플리케이션 헬퍼
 *
 * E2E 테스트에서 실제 NestJS 앱을 생성하여 HTTP 요청을 테스트합니다.
 * 프로덕션 앱과 동일한 설정(ValidationPipe 등)을 적용하되,
 * DB만 테스트 전용으로 교체합니다.
 */
export class TestApp {
  private module: TestingModule | null = null;
  private _app: INestApplication | null = null;

  /**
   * NestJS 애플리케이션 인스턴스를 반환합니다.
   * supertest와 함께 사용합니다.
   */
  get app(): INestApplication {
    if (!this._app) {
      throw new Error(
        'TestApp이 초기화되지 않았습니다. init()을 먼저 호출하세요.',
      );
    }
    return this._app;
  }

  /**
   * 테스트 애플리케이션을 초기화합니다.
   *
   * 주요 동작:
   * 1. AppModule을 기반으로 테스트 모듈을 생성합니다.
   * 2. DatabaseModule을 테스트 전용 DB로 오버라이드합니다.
   * 3. 프로덕션과 동일한 글로벌 파이프를 적용합니다.
   * 4. HTTP 리스닝은 시작하지 않습니다 (supertest가 대신 처리).
   */
  async init(): Promise<void> {
    this.module = await Test.createTestingModule({
      imports: [AppModule],
    })
      // DatabaseModule의 DB를 테스트 전용으로 오버라이드
      .overrideModule(DatabaseModule)
      .useModule(
        DatabaseModule.forRoot({
          url: 'postgresql://user:password@localhost:5432/todo_test',
        }),
      )
      .compile();

    this._app = this.module.createNestApplication();

    // 프로덕션 main.ts와 동일한 설정 적용
    this._app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    this._app.setGlobalPrefix('api');

    await this._app.init();
  }

  /**
   * 테스트 애플리케이션을 종료합니다.
   * afterAll에서 반드시 호출하여 리소스를 정리합니다.
   */
  async close(): Promise<void> {
    if (this._app) {
      await this._app.close();
      this._app = null;
    }
    if (this.module) {
      await this.module.close();
      this.module = null;
    }
  }
}

/**
 * 테스트 앱을 생성하고 초기화하는 팩토리 함수
 *
 * @example
 * import * as request from 'supertest';
 *
 * describe('Todo E2E', () => {
 *   let testApp: TestApp;
 *
 *   beforeAll(async () => {
 *     testApp = await createTestApp();
 *   });
 *
 *   afterAll(async () => {
 *     await testApp.close();
 *   });
 *
 *   it('POST /api/todos', () => {
 *     return request(testApp.app.getHttpServer())
 *       .post('/api/todos')
 *       .send({ title: '테스트' })
 *       .expect(201);
 *   });
 * });
 */
export async function createTestApp(): Promise<TestApp> {
  const testApp = new TestApp();
  await testApp.init();
  return testApp;
}
