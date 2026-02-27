# Todo API - Clean Architecture with NestJS

NestJS 기반의 Todo REST API로, **클린 아키텍처**와 **도메인 주도 설계(DDD)** 원칙을 적용한 프로젝트입니다.

## 아키텍처 개요

### 의존성 규칙 (Dependency Rule)

클린 아키텍처의 핵심은 **의존성이 항상 안쪽(도메인)을 향한다**는 것입니다.

```
┌──────────────────────────────────────────────────────────┐
│  Presentation (Controllers, Responses)                   │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Application (Services, DTOs)                      │  │
│  │  ┌──────────────────────────────────────────────┐  │  │
│  │  │  Domain (Entities, Value Objects, Use Cases) │  │  │
│  │  └──────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────┘  │
│  Infrastructure (Repository 구현, Mapper, DB)            │
└──────────────────────────────────────────────────────────┘
```

```
Presentation ──→ Application ──→ Domain ←── Infrastructure
                                   ▲              │
                                   └──────────────┘
                              (인터페이스를 구현)
```

- **Domain**은 어떤 외부 레이어도 알지 못합니다 (프레임워크 의존성 0)
- **Infrastructure**는 Domain이 정의한 인터페이스(Port)를 구현합니다
- **Application**은 Domain의 Use Case를 조율합니다
- **Presentation**은 HTTP 요청/응답만 담당합니다

### 의존성 역전 원칙 (DIP)

Repository 패턴을 통해 DIP를 구현합니다.

```typescript
// Domain: 인터페이스 정의 (Port)
// src/todo/domain/repositories/todo.repository.interface.ts
interface TodoRepository {
  findById(id: number): Promise<Todo | null>;
  save(todo: Todo): Promise<Todo>;
  // ...
}

// Infrastructure: 구현체 (Adapter)
// src/todo/infrastructure/persistence/prisma-todo.repository.ts
class PrismaTodoRepository implements TodoRepository {
  // Prisma를 사용한 구체 구현
}

// DI 설정: Symbol 토큰으로 연결
// src/todo/infrastructure/todo-infrastructure.module.ts
{ provide: TODO_REPOSITORY, useClass: PrismaTodoRepository }
```

Domain은 `TodoRepository` 인터페이스만 알고, 구현체(Prisma)를 모릅니다.
DB를 교체해도 Domain과 Application 레이어는 변경이 필요 없습니다.

---

## 레이어별 상세 설명

### Domain Layer (`src/todo/domain/`)

비즈니스 로직의 핵심입니다. **순수 TypeScript**로 작성되어 프레임워크에 의존하지 않습니다.

#### Entity - Rich Domain Model

```
src/todo/domain/entities/todo.entity.ts
```

- Private 생성자 + 팩토리 메서드 (`create`, `reconstruct`)
- 상태와 행위를 캡슐화한 Rich Domain Model
- Value Object를 통한 자기 유효성 검증
- 상태 변경: `complete()`, `toggleComplete()`, `changeStatus()`
- 데이터 변경: `updateTitle()`, `updateDescription()`
- 쿼리: `isCompleted()`, `canTransitionTo()`, `getAvailableTransitions()`

#### Value Objects

| Value Object | 파일 | 역할 |
|---|---|---|
| `TodoTitle` | `value-objects/todo-title.vo.ts` | 제목 유효성 검증 (1~100자), 자동 trim |
| `TodoStatus` | `value-objects/todo-status.vo.ts` | 상태 관리 및 전이 규칙 |

**상태 전이 규칙:**

```
PENDING ──→ IN_PROGRESS ──→ COMPLETED
  ▲              │              │
  │              ▼              │
  └──────── PENDING ←──────────┘
```

허용되지 않는 전이를 시도하면 `InvalidStatusTransitionError`가 발생합니다.

#### Use Cases

각 Use Case는 **단일 책임 원칙(SRP)**을 따르며, 하나의 비즈니스 작업만 수행합니다.

| Use Case | 입력 | 출력 |
|---|---|---|
| `CreateTodoUseCase` | `{ title, description? }` | 생성된 Todo |
| `GetTodosUseCase` | `{ pagination?, filter? }` | `PaginatedResult<Todo>` |
| `GetTodoByIdUseCase` | `id` | Todo (없으면 에러) |
| `UpdateTodoUseCase` | `{ id, title?, description?, status? }` | 수정된 Todo |
| `DeleteTodoUseCase` | `id` | void |
| `ToggleTodoUseCase` | `id` | 토글된 Todo |

#### Domain Errors

프레임워크 독립적인 에러 체계입니다. 각 에러는 고유 `code`를 가집니다.

| Error | Code | 의미 |
|---|---|---|
| `DomainError` | - | 기본 클래스 |
| `TodoNotFoundError` | `TODO_NOT_FOUND` | 존재하지 않는 Todo |
| `InvalidTodoTitleError` | `INVALID_TODO_TITLE` | 제목 유효성 실패 |
| `InvalidStatusTransitionError` | `INVALID_STATUS_TRANSITION` | 허용되지 않는 상태 전이 |

### Application Layer (`src/todo/application/`)

Domain의 Use Case를 조율하고, 외부 요청(DTO)을 도메인 명령으로 변환합니다.

```
application/
├── dto/
│   ├── create-todo.dto.ts       # 생성 요청 DTO (class-validator)
│   └── update-todo.dto.ts       # 수정 요청 DTO (PartialType)
└── services/
    └── todo.service.ts          # Use Case 조율 서비스
```

`TodoService`는 얇은 조율 계층(Thin Orchestration Layer)으로, 비즈니스 로직을 포함하지 않습니다.
각 메서드는 적절한 Use Case를 호출하고 결과를 반환합니다.

### Infrastructure Layer (`src/todo/infrastructure/`)

외부 시스템(DB)과의 통신을 담당합니다.

```
infrastructure/
├── todo-infrastructure.module.ts        # DI 설정
└── persistence/
    ├── prisma-todo.repository.ts        # TodoRepository 구현
    └── todo.mapper.ts                   # DB Record ↔ Domain Entity 변환
```

- `PrismaTodoRepository`: Domain의 `TodoRepository` 인터페이스를 Prisma로 구현
- `TodoMapper`: Prisma Record와 Domain Entity 간 양방향 변환
  - `toDomain()`: DB 레코드 → 도메인 엔티티 (Value Object 복원)
  - `toPrisma()`: 도메인 엔티티 → DB 레코드 (원시값 추출)

### Presentation Layer (`src/todo/presentation/`)

HTTP 요청/응답을 처리합니다. 비즈니스 로직을 포함하지 않습니다.

```
presentation/
├── controllers/
│   └── todo.controller.ts       # REST API 엔드포인트
└── responses/
    └── todo.response.ts         # API 응답 변환
```

---

## 프로젝트 구조

```
src/
├── main.ts                              # 진입점
├── app.module.ts                        # 루트 모듈
├── common/
│   └── filters/
│       └── domain-exception.filter.ts   # DomainError → HTTP 응답 변환
├── database/
│   ├── database.module.ts               # Prisma DB 모듈
│   └── prisma.provider.ts              # Prisma 프로바이더
└── todo/
    ├── todo.module.ts                   # Todo 피처 모듈
    ├── domain/                          # 🟢 순수 비즈니스 로직
    │   ├── entities/
    │   ├── value-objects/
    │   ├── use-cases/
    │   ├── repositories/                #    인터페이스 (Port)
    │   └── errors/
    ├── application/                     # 🔵 Use Case 조율
    │   ├── dto/
    │   └── services/
    ├── infrastructure/                  # 🟠 외부 시스템 연동
    │   └── persistence/                 #    Repository 구현 (Adapter)
    └── presentation/                    # 🟣 HTTP 인터페이스
        ├── controllers/
        └── responses/
```

---

## API 엔드포인트

| Method | Endpoint | 설명 | 응답 코드 |
|--------|----------|------|-----------|
| `POST` | `/todos` | Todo 생성 | 201 |
| `GET` | `/todos` | Todo 목록 조회 (페이지네이션) | 200 |
| `GET` | `/todos/:id` | Todo 단건 조회 | 200 |
| `PUT` | `/todos/:id` | Todo 수정 (전체) | 200 |
| `PATCH` | `/todos/:id` | Todo 수정 (부분) | 200 |
| `PATCH` | `/todos/:id/toggle` | Todo 완료 토글 | 200 |
| `DELETE` | `/todos/:id` | Todo 삭제 | 204 |

### 쿼리 파라미터 (GET /todos)

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `limit` | number | 10 | 페이지당 항목 수 |
| `status` | string | - | 상태 필터 (PENDING, IN_PROGRESS, COMPLETED) |
| `search` | string | - | 제목 검색어 |

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript (strict mode) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Validation | class-validator / class-transformer |
| Package Manager | pnpm |
| Test | Jest 30 |

---

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm
- Docker (PostgreSQL 용)

### 설치

```bash
# 의존성 설치
pnpm install

# PostgreSQL 실행 (Docker)
pnpm db:up

# DB 마이그레이션
pnpm db:migrate

# Prisma 클라이언트 생성
pnpm prisma generate

# 개발 서버 실행
pnpm start:dev
```

### 환경 변수

`.env` 파일을 프로젝트 루트에 생성합니다.

```env
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
```

---

## 테스트

### 테스트 전략

```
┌─────────────────────────────────┐
│           E2E Tests             │  HTTP → Controller → Service → DB
│     (전체 흐름 검증, 58개)       │
├─────────────────────────────────┤
│      Integration Tests          │  Repository + DB 실제 연동
│     (인프라 계층 검증)           │
├─────────────────────────────────┤
│         Unit Tests              │  순수 도메인 로직
│   (도메인 계층 검증, 108개)      │  프레임워크/DB 없이 실행
└─────────────────────────────────┘
```

### 실행 명령

```bash
# 단위 테스트
pnpm test:unit

# 통합 테스트
pnpm test:integration

# E2E 테스트
pnpm test:e2e

# 커버리지 리포트
pnpm test:cov
```

### 테스트 구조

```
test/
├── unit/                     # 단위 테스트 (DB/프레임워크 불필요)
│   └── domain/
│       ├── entities/         # 엔티티 행위 테스트
│       ├── value-objects/    # VO 유효성 검증 테스트
│       ├── use-cases/        # Use Case 로직 테스트 (Mock Repository)
│       └── errors/           # 도메인 에러 테스트
├── integration/              # 통합 테스트 (실제 DB 사용)
│   ├── persistence/          # Repository + Mapper 검증
│   └── use-cases/            # Use Case + Repository 연동
├── e2e/                      # E2E 테스트 (HTTP 요청)
│   ├── todo.e2e-spec.ts      # CRUD 정상 흐름
│   └── todo-errors.e2e-spec.ts  # 에러 케이스
├── factories/                # 테스트 데이터 팩토리
├── fixtures/                 # 테스트 픽스처
└── helpers/                  # 테스트 유틸리티
    └── in-memory-todo.repository.ts  # 인메모리 Repository
```

---

## 설계 원칙

| 원칙 | 적용 |
|------|------|
| **의존성 규칙** | 외부 → 내부 단방향 의존. Domain은 프레임워크를 모름 |
| **의존성 역전 (DIP)** | `TODO_REPOSITORY` Symbol 토큰으로 인터페이스와 구현 분리 |
| **단일 책임 (SRP)** | Use Case 하나당 하나의 비즈니스 작업 |
| **Rich Domain Model** | Entity가 상태와 행위를 함께 캡슐화 |
| **Value Objects** | 원시값 대신 의미 있는 타입으로 불변 객체 사용 |
| **팩토리 메서드** | Entity 생성을 `create()`, `reconstruct()`로 통제 |
| **Mapper 패턴** | Domain ↔ Persistence 간 변환 분리 |
| **글로벌 예외 필터** | DomainError → HTTP 응답 자동 변환 |
