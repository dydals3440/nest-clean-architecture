// test/helpers/api.helper.ts
// getHttpServer()는 any를 반환하므로 supertest 호출 시 unsafe-argument 발생
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateTodoInput } from '../factories/todo.factory';

/**
 * E2E 테스트용 API 헬퍼
 *
 * 자주 사용하는 API 호출을 래핑하여 반복 코드를 줄인다.
 * supertest의 체이닝을 숨기고, 간결한 인터페이스를 제공한다.
 */

// ─── 타입 정의 ───

interface UpdateTodoDto {
  title?: string;
  description?: string | null;
  status?: string;
}

interface QueryParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface TodoResponse {
  id: number;
  title: string;
  description: string | null;
  status: string;
  isCompleted: boolean;
  availableTransitions: string[];
  createdAt: string;
  updatedAt: string;
}

interface PaginatedTodoResponse {
  data: TodoResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── API 헬퍼 클래스 ───

export class TodoApiHelper {
  constructor(private readonly app: INestApplication) {}

  /**
   * Todo 생성
   * @returns 생성된 Todo 객체
   */
  async createTodo(dto: CreateTodoInput): Promise<TodoResponse> {
    const response = await request(this.app.getHttpServer())
      .post('/api/todos')
      .send(dto)
      .expect(201);

    return response.body as TodoResponse;
  }

  /**
   * Todo 생성 (상태 코드 검증 없이 - 에러 케이스용)
   * @returns supertest Response 객체
   */
  async createTodoRaw(dto: Record<string, unknown>): Promise<request.Response> {
    return request(this.app.getHttpServer()).post('/api/todos').send(dto);
  }

  /**
   * Todo 전체 조회 (페이지네이션 응답)
   * @returns 페이지네이션된 Todo 목록
   */
  async getTodos(params?: QueryParams): Promise<PaginatedTodoResponse> {
    let req = request(this.app.getHttpServer()).get('/api/todos');

    if (params) {
      req = req.query(params);
    }

    const response = await req.expect(200);
    return response.body as PaginatedTodoResponse;
  }

  /**
   * Todo 전체 조회 (상태 코드 검증 없이)
   */
  async getTodosRaw(params?: QueryParams): Promise<request.Response> {
    let req = request(this.app.getHttpServer()).get('/api/todos');

    if (params) {
      req = req.query(params);
    }

    return req;
  }

  /**
   * Todo 단건 조회
   * @returns Todo 객체
   */
  async getTodoById(id: number): Promise<TodoResponse> {
    const response = await request(this.app.getHttpServer())
      .get(`/api/todos/${id}`)
      .expect(200);

    return response.body as TodoResponse;
  }

  /**
   * Todo 단건 조회 (상태 코드 검증 없이)
   */
  async getTodoByIdRaw(id: number | string): Promise<request.Response> {
    return request(this.app.getHttpServer()).get(`/api/todos/${id}`);
  }

  /**
   * Todo 수정
   * @returns 수정된 Todo 객체
   */
  async updateTodo(id: number, dto: UpdateTodoDto): Promise<TodoResponse> {
    const response = await request(this.app.getHttpServer())
      .patch(`/api/todos/${id}`)
      .send(dto)
      .expect(200);

    return response.body as TodoResponse;
  }

  /**
   * Todo 수정 (상태 코드 검증 없이)
   */
  async updateTodoRaw(
    id: number | string,
    dto: Record<string, unknown>,
  ): Promise<request.Response> {
    return request(this.app.getHttpServer())
      .patch(`/api/todos/${id}`)
      .send(dto);
  }

  /**
   * Todo 완료 토글
   * @returns 토글된 Todo 객체
   */
  async toggleTodo(id: number): Promise<TodoResponse> {
    const response = await request(this.app.getHttpServer())
      .patch(`/api/todos/${id}/toggle`)
      .expect(200);

    return response.body as TodoResponse;
  }

  /**
   * Todo 완료 토글 (상태 코드 검증 없이)
   */
  async toggleTodoRaw(id: number | string): Promise<request.Response> {
    return request(this.app.getHttpServer()).patch(`/api/todos/${id}/toggle`);
  }

  /**
   * Todo 삭제 (204 No Content)
   */
  async deleteTodo(id: number): Promise<void> {
    await request(this.app.getHttpServer())
      .delete(`/api/todos/${id}`)
      .expect(204);
  }

  /**
   * Todo 삭제 (상태 코드 검증 없이)
   */
  async deleteTodoRaw(id: number | string): Promise<request.Response> {
    return request(this.app.getHttpServer()).delete(`/api/todos/${id}`);
  }

  // ─── 복합 헬퍼 메서드 ───

  /**
   * 여러 Todo를 한번에 생성
   * @returns 생성된 Todo 배열
   */
  async createManyTodos(dtos: CreateTodoInput[]): Promise<TodoResponse[]> {
    const results: TodoResponse[] = [];
    for (const dto of dtos) {
      const todo = await this.createTodo(dto);
      results.push(todo);
    }
    return results;
  }

  /**
   * 빠르게 N개의 Todo 생성 (기본 데이터 사용)
   */
  async createBulkTodos(count: number): Promise<TodoResponse[]> {
    const dtos = Array.from({ length: count }, (_, i) => ({
      title: `벌크 Todo #${i + 1}`,
    }));
    return this.createManyTodos(dtos);
  }

  /**
   * Todo 생성 후 완료 처리까지
   */
  async createCompletedTodo(dto: CreateTodoInput): Promise<TodoResponse> {
    const todo = await this.createTodo(dto);
    return this.toggleTodo(todo.id);
  }
}
