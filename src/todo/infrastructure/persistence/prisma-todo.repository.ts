import { Injectable, Inject } from '@nestjs/common';
import { PrismaClient, Prisma } from '../../../generated/prisma/client';

import { Todo } from '../../domain/entities/todo.entity';
import { TodoStatusType } from '../../domain/value-objects/todo-status.vo';
import {
  TodoRepository,
  PaginationOptions,
  TodoFilterOptions,
  PaginatedResult,
} from '../../domain/repositories/todo.repository.interface';

import { TodoMapper } from './todo.mapper';
import { PRISMA_SERVICE } from '../../../database/database.constants';

/**
 * Prisma ORM 기반 TodoRepository 구현체
 *
 * 이 클래스는 헥사고날 아키텍처에서 "Adapter" 역할을 합니다.
 * Domain Layer의 TodoRepository 인터페이스(Port)를 구현하여
 * 실제 PostgreSQL DB와의 통신을 담당합니다.
 *
 * Prisma Client API의 특징:
 * - 선언적 쿼리: SQL을 직접 작성하지 않고 객체 형태로 쿼리를 구성합니다
 * - 타입 안전성: prisma generate로 생성된 타입이 쿼리 작성을 안내합니다
 * - 자동 매핑: @map/@@@map으로 정의한 컬럼명 매핑이 자동 적용됩니다
 *
 * 의존성 방향:
 * PrismaTodoRepository → TodoRepository (Interface)
 *                       → Todo (Domain Entity)
 *                       → TodoMapper
 *                       → Prisma Client (외부 라이브러리)
 *
 * 이 클래스는 NestJS의 @Injectable() 데코레이터를 사용합니다.
 * Infrastructure Layer는 프레임워크에 의존해도 괜찮습니다.
 * (가장 바깥쪽 원이므로)
 */
@Injectable()
export class PrismaTodoRepository implements TodoRepository {
  constructor(
    /**
     * Prisma Client 인스턴스
     *
     * DatabaseModule에서 제공하는 PrismaClient를 주입받습니다.
     * PRISMA_SERVICE은 DI 토큰(Symbol)입니다.
     *
     * Part 2에서 설정한 DatabaseModule의 provider를 사용합니다:
     * { provide: PRISMA_SERVICE, useFactory: ... }
     */
    @Inject(PRISMA_SERVICE)
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * 전체 Todo 목록을 페이지네이션과 필터링을 적용하여 조회합니다.
   *
   * Prisma Client의 findMany()와 count()를 사용하여
   * 동적으로 필터링과 페이지네이션을 구성합니다.
   *
   * Promise.all로 데이터 조회와 카운트를 병렬 실행하여 성능을 최적화합니다.
   *
   * @param pagination - 페이지네이션 옵션 (기본: page=1, limit=10)
   * @param filter - 필터링 옵션 (상태, 제목 검색)
   * @returns 페이지네이션된 Todo 목록
   */
  async findAll(
    pagination?: PaginationOptions,
    filter?: TodoFilterOptions,
  ): Promise<PaginatedResult<Todo>> {
    // 기본 페이지네이션 값
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const skip = (page - 1) * limit;

    // 동적 WHERE 조건 구성
    const where = this.buildWhereClause(filter);

    // 데이터 조회와 전체 개수를 병렬로 실행
    const [records, total] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.todo.count({ where }),
    ]);

    // Prisma 레코드 → 도메인 엔티티 변환
    const data = TodoMapper.toDomainList(records);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * ID로 단일 Todo를 조회합니다.
   *
   * findUnique()는 고유 필드(id, unique 제약)로 단일 레코드를 조회합니다.
   * 존재하지 않으면 null을 반환합니다.
   *
   * @param id - Todo ID
   * @returns Todo 엔티티 또는 null
   */
  async findById(id: number): Promise<Todo | null> {
    const record = await this.prisma.todo.findUnique({
      where: { id },
    });

    // 결과가 없으면 null 반환
    if (!record) {
      return null;
    }

    // Prisma 레코드 → 도메인 엔티티 변환
    return TodoMapper.toDomain(record);
  }

  /**
   * 특정 상태의 Todo 목록을 조회합니다.
   *
   * @param status - 조회할 상태
   * @returns 해당 상태의 Todo 목록
   */
  async findByStatus(status: TodoStatusType): Promise<Todo[]> {
    const records = await this.prisma.todo.findMany({
      where: { status },
      orderBy: { createdAt: 'desc' },
    });

    return TodoMapper.toDomainList(records);
  }

  /**
   * 새로운 Todo를 DB에 저장합니다.
   *
   * create()는 레코드를 생성하고 자동으로 생성된 레코드를 반환합니다.
   * DB에서 자동 생성된 id와 기본값(createdAt, updatedAt)을 확인할 수 있습니다.
   *
   * @param todo - 저장할 도메인 엔티티 (id는 null)
   * @returns ID가 할당된 도메인 엔티티
   */
  async save(todo: Todo): Promise<Todo> {
    const data = TodoMapper.toPersistence(todo);

    const record = await this.prisma.todo.create({ data });

    // 생성 결과를 도메인 엔티티로 변환하여 반환
    return TodoMapper.toDomain(record);
  }

  /**
   * 기존 Todo를 업데이트합니다.
   *
   * update()는 where로 대상을 특정하고, data로 변경할 필드를 지정합니다.
   * 업데이트된 레코드를 자동으로 반환합니다.
   * @updatedAt 속성에 의해 updatedAt 필드가 자동 갱신됩니다.
   *
   * @param todo - 업데이트할 도메인 엔티티 (id 필수)
   * @returns 업데이트된 도메인 엔티티
   */
  async update(todo: Todo): Promise<Todo> {
    const data = TodoMapper.toUpdatePersistence(todo);

    const record = await this.prisma.todo.update({
      where: { id: todo.id! },
      data,
    });

    return TodoMapper.toDomain(record);
  }

  /**
   * Todo를 삭제합니다.
   *
   * @param id - 삭제할 Todo의 ID
   */
  async delete(id: number): Promise<void> {
    await this.prisma.todo.delete({
      where: { id },
    });
  }

  /**
   * 조건에 맞는 Todo 수를 반환합니다.
   *
   * @param filter - 필터링 옵션 (선택)
   * @returns Todo 수
   */
  async count(filter?: TodoFilterOptions): Promise<number> {
    const where = this.buildWhereClause(filter);

    return this.prisma.todo.count({ where });
  }

  // ─────────────────────────────────────────────
  // Private Helper Methods
  // ─────────────────────────────────────────────

  /**
   * 필터 옵션에 따라 Prisma WHERE 조건을 동적으로 구성합니다.
   *
   * Prisma의 타입 안전한 WhereInput을 사용하여
   * 객체 형태로 조건을 구성합니다.
   *
   * Prisma의 필터링 방식:
   * - 단순 비교: { status: 'PENDING' }
   * - 부분 일치: { title: { contains: '장보기', mode: 'insensitive' } }
   * - OR 조건: { OR: [조건1, 조건2] }
   * - AND 조건: 객체의 여러 필드 (자동 AND)
   *
   * @param filter - 필터링 옵션
   * @returns Prisma WHERE 조건 객체
   */
  private buildWhereClause(filter?: TodoFilterOptions): Prisma.TodoWhereInput {
    if (!filter) return {};

    const where: Prisma.TodoWhereInput = {};

    if (filter.status) {
      // 단순 일치: status = 'PENDING'
      where.status = filter.status;
    }

    if (filter.titleSearch) {
      // 대소문자 무시 부분 일치: title ILIKE '%키워드%'
      where.title = {
        contains: filter.titleSearch,
        mode: 'insensitive',
      };
    }

    return where;
  }
}
