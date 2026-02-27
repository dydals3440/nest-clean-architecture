// src/app.module.ts

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { DatabaseModule } from './database';
import { TodoModule } from './todo/todo.module';
import { DomainExceptionFilter } from './common/filters/domain-exception.filter';

/**
 * 애플리케이션 루트 모듈
 *
 * 모든 피처 모듈과 글로벌 설정을 등록합니다.
 *
 * 모듈 구성:
 * ┌──────────────────────────────────────────────┐
 * │                  AppModule                    │
 * │                                               │
 * │  imports:                                     │
 * │  ├── DatabaseModule (DB 연결)                  │
 * │  └── TodoModule (Todo 피처)                    │
 * │                                               │
 * │  providers:                                   │
 * │  ├── ValidationPipe (글로벌 유효성 검증)        │
 * │  └── DomainExceptionFilter (글로벌 예외 필터)   │
 * └──────────────────────────────────────────────┘
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    /**
     * 데이터베이스 모듈
     *
     * Part 2에서 구현한 Prisma ORM + PostgreSQL 연결 모듈입니다.
     * PRISMA_SERVICE 토큰을 전역으로 제공합니다.
     */
    DatabaseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        url: configService.get<string>(
          'DATABSE_URL',
          'postgresql://user:password@localhost:5432/todo_db',
        ),
      }),
    }),

    /**
     * Todo 피처 모듈
     *
     * Todo 도메인의 모든 기능을 포함합니다.
     * 새 도메인을 추가할 때 이곳에 모듈을 등록합니다.
     * 예: UserModule, ProjectModule 등
     */
    TodoModule,
  ],
  providers: [
    /**
     * 글로벌 ValidationPipe
     *
     * 모든 Controller에 자동으로 적용됩니다.
     * DTO의 class-validator 데코레이터로 유효성을 검증합니다.
     *
     * APP_PIPE 토큰을 사용하면 main.ts에서 설정하는 대신
     * DI 시스템을 통해 글로벌 파이프를 등록할 수 있습니다.
     */
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        /**
         * DTO에 정의되지 않은 속성을 자동 제거합니다.
         * 클라이언트가 { "title": "test", "hack": "attack" }를 보내면
         * "hack" 필드가 자동으로 제거됩니다.
         */
        whitelist: true,

        /**
         * 정의되지 않은 속성이 있으면 에러를 반환합니다.
         * whitelist와 함께 사용하면 보안이 강화됩니다.
         * (이 옵션을 false로 하면 자동 제거만 하고 에러는 안 남)
         */
        forbidNonWhitelisted: true,

        /**
         * 요청 body의 plain object를 DTO 클래스 인스턴스로 자동 변환합니다.
         * 이 옵션이 없으면 class-validator 데코레이터가 동작하지 않습니다.
         */
        transform: true,

        /**
         * 변환 옵션: 쿼리 파라미터 등도 타입에 맞게 변환합니다.
         */
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    },

    /**
     * 글로벌 도메인 예외 필터
     *
     * APP_FILTER 토큰으로 글로벌 필터를 DI 시스템으로 등록합니다.
     * main.ts의 app.useGlobalFilters() 대신 사용합니다.
     *
     * DI 시스템으로 등록하면:
     * 1. 다른 서비스를 필터에 주입할 수 있습니다
     * 2. 모듈 시스템으로 관리할 수 있습니다
     */
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
