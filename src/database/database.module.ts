// src/database/database.module.ts
import { DynamicModule, Global, Module } from '@nestjs/common';
import { DATABASE_OPTIONS, PRISMA_SERVICE } from './database.constants';
import {
  DatabaseOptions,
  DatabaseAsyncOptions,
} from './database-options.interface';
import { prismaProvider } from './prisma.provider';

/**
 * DatabaseModule - Prisma ORM을 NestJS에 통합하는 모듈
 *
 * @Global() 데코레이터를 사용하여 애플리케이션 전역에서 PRISMA_SERVICE 토큰을
 * import 없이 사용할 수 있게 합니다.
 *
 * Dynamic Module 패턴을 사용하여 데이터베이스 설정을 외부에서 주입받습니다.
 * 이는 다음과 같은 이점을 제공합니다:
 * - 환경별로 다른 DB 설정 사용 가능 (개발: 로컬 DB, 테스트: 테스트 전용 DB)
 * - ConfigModule/ConfigService를 통한 설정 관리
 * - 테스트에서 쉽게 설정 교체 가능
 */
@Global()
@Module({})
export class DatabaseModule {
  /**
   * 동기식 설정 - 설정값을 직접 전달할 때 사용
   *
   * @example
   * // 가장 간단한 사용 방식
   * DatabaseModule.forRoot({
   *   url: 'postgresql://user:password@localhost:5432/todo_db',
   * })
   *
   * @example
   * // 테스트 DB
   * DatabaseModule.forRoot({
   *   url: 'postgresql://user:password@localhost:5432/todo_test',
   * })
   */
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        // 옵션 객체를 Provider로 등록
        {
          provide: DATABASE_OPTIONS,
          useValue: options,
        },
        // Prisma 인스턴스 Provider
        prismaProvider,
      ],
      exports: [PRISMA_SERVICE],
    };
  }

  /**
   * 비동기식 설정 - 설정값을 비동기로 가져올 때 사용
   *
   * ConfigModule과 함께 사용할 때 유용합니다.
   * ConfigService가 환경 변수를 읽어 DB 연결 URL을 결정할 수 있습니다.
   *
   * @example
   * DatabaseModule.forRootAsync({
   *   imports: [ConfigModule],
   *   inject: [ConfigService],
   *   useFactory: (configService: ConfigService) => ({
   *     url: configService.get<string>('DATABASE_URL', 'postgresql://user:password@localhost:5432/todo_db'),
   *   }),
   * })
   */
  static forRootAsync(options: DatabaseAsyncOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: options.imports || [],
      providers: [
        // 비동기 팩토리로 옵션 생성
        {
          provide: DATABASE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        // Prisma 인스턴스 Provider
        prismaProvider,
      ],
      exports: [PRISMA_SERVICE],
    };
  }
}
