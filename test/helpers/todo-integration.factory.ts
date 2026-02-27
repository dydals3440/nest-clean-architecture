// test/helpers/todo-integration.factory.ts

import { PrismaClient, Prisma } from '../../src/generated/prisma/client';

/**
 * 통합 테스트용 Todo 팩토리
 *
 * DB에 직접 데이터를 삽입하거나, 도메인 엔티티를 생성하는 유틸리티입니다.
 * 단위 테스트용 팩토리(Part 2)와 달리, 실제 DB 삽입을 지원합니다.
 */
export class TodoIntegrationFactory {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * DB에 Todo 레코드를 직접 삽입합니다.
   * Repository를 거치지 않고 테스트 데이터를 준비할 때 사용합니다.
   */
  async insertTodo(
    overrides: Partial<Prisma.TodoCreateInput> = {},
  ): Promise<{ id: number }> {
    const result = await this.prisma.todo.create({
      data: {
        title: overrides.title ?? '테스트 할 일',
        description: overrides.description ?? null,
        status: overrides.status ?? 'PENDING',
      },
    });

    return { id: result.id };
  }

  /**
   * 여러 개의 Todo를 한 번에 삽입합니다.
   */
  async insertMany(
    count: number,
    overrides: Partial<Prisma.TodoCreateInput> = {},
  ): Promise<{ ids: number[] }> {
    const ids: number[] = [];
    for (let i = 0; i < count; i++) {
      const { id } = await this.insertTodo({
        ...overrides,
        title: overrides.title ?? `테스트 할 일 ${i + 1}`,
      });
      ids.push(id);
    }
    return { ids };
  }
}
