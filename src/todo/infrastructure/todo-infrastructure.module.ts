import { Module } from '@nestjs/common';
import { PrismaTodoRepository } from './persistence/prisma-todo.repository';
import { TODO_REPOSITORY } from '../domain/repositories/todo.repository.interface';
import { DatabaseModule } from '../../database/database.module';

/**
 * Todo Infrastructure 모듈
 *
 * 이 모듈의 핵심 역할은 **의존성 역전(DIP)을 실현**하는 것입니다.
 *
 * Domain Layer에서 정의한 TodoRepository 인터페이스(Port)에
 * PrismaTodoRepository 구현체(Adapter)를 바인딩합니다.
 *
 * ```
 * TODO_REPOSITORY (Symbol 토큰)
 *       │
 *       ▼
 * { provide: TODO_REPOSITORY, useClass: PrismaTodoRepository }
 *       │
 *       ▼
 * NestJS DI Container가 TODO_REPOSITORY 토큰으로 주입 요청이 오면
 * PrismaTodoRepository 인스턴스를 생성하여 제공합니다
 * ```
 *
 * 교체 시나리오:
 * - MySQL → PostgreSQL: PrismaTodoRepository를 PostgresTodoRepository로 교체
 * - Prisma → TypeORM: PrismaTodoRepository를 TypeORMTodoRepository로 교체
 * - 테스트: PrismaTodoRepository를 InMemoryTodoRepository로 교체
 *
 * 어떤 경우든 이 모듈의 useClass만 변경하면 됩니다.
 * Domain Layer의 코드는 전혀 변경할 필요가 없습니다.
 */
@Module({
  imports: [
    /**
     * DatabaseModule을 import하여 PRISMA_SERVICE 토큰을 사용할 수 있게 합니다.
     * PrismaTodoRepository가 @Inject(PRISMA_SERVICE)로 DB 인스턴스를 주입받습니다.
     */
    DatabaseModule,
  ],
  providers: [
    /**
     * 핵심 바인딩: 인터페이스 토큰 → 구현체
     *
     * provide: 주입 토큰 (Symbol)
     * useClass: 실제 인스턴스를 생성할 클래스
     *
     * 이 설정으로 NestJS는:
     * 1. @Inject(TODO_REPOSITORY)를 찾으면
     * 2. PrismaTodoRepository를 인스턴스화하여
     * 3. 해당 파라미터에 주입합니다
     */
    {
      provide: TODO_REPOSITORY,
      useClass: PrismaTodoRepository,
    },
  ],
  exports: [
    /**
     * TODO_REPOSITORY를 export하여 다른 모듈에서 사용할 수 있게 합니다.
     *
     * TodoModule이 이 모듈을 import하면 TODO_REPOSITORY를 주입받을 수 있습니다.
     */
    TODO_REPOSITORY,
  ],
})
export class TodoInfrastructureModule {}
