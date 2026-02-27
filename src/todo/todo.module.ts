import { Module } from '@nestjs/common';

import { TodoInfrastructureModule } from './infrastructure/todo-infrastructure.module';
import { TodoService } from './application/services/todo.service';
import { TodoController } from './presentation/controllers/todo.controller';

/**
 * Todo 피처 모듈
 *
 * Todo 도메인의 모든 계층을 하나의 NestJS 모듈로 통합합니다.
 *
 * 모듈 구성:
 * ┌─────────────────────────────────────────┐
 * │              TodoModule                 │
 * │                                         │
 * │  imports:                               │
 * │  ├── TodoInfrastructureModule            │
 * │  │   (Repository 바인딩, DB 연결)        │
 * │  │                                      │
 * │  providers:                             │
 * │  ├── TodoService                        │
 * │  │   (Use Case 조합, DI 연결)           │
 * │  │                                      │
 * │  controllers:                           │
 * │  ├── TodoController                     │
 * │  │   (REST API 엔드포인트)              │
 * └─────────────────────────────────────────┘
 *
 * 의존성 흐름:
 * TodoController → TodoService → TODO_REPOSITORY
 *                                      │
 *                                      ▼
 *                               PrismaTodoRepository
 *                               (Infrastructure Module에서 제공)
 */
@Module({
  imports: [
    /**
     * Infrastructure 모듈 import
     *
     * 이 모듈이 TODO_REPOSITORY 토큰을 export하므로,
     * TodoService에서 @Inject(TODO_REPOSITORY)로 사용할 수 있습니다.
     */
    TodoInfrastructureModule,
  ],
  controllers: [
    /**
     * Presentation Layer 컨트롤러
     */
    TodoController,
  ],
  providers: [
    /**
     * Application Layer 서비스
     *
     * TodoService는 @Injectable()이므로 직접 등록합니다.
     * NestJS가 자동으로:
     * 1. TodoService의 constructor 파라미터를 분석
     * 2. @Inject(TODO_REPOSITORY)를 발견
     * 3. TodoInfrastructureModule에서 export한 TODO_REPOSITORY를 찾아 주입
     */
    TodoService,
  ],
})
export class TodoModule {}
