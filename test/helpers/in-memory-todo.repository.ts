// test/helpers/in-memory-todo.repository.ts

import { Todo } from '@/todo/domain/entities/todo.entity';
import { TodoStatusType } from '@/todo/domain/value-objects/todo-status.vo';
import {
  TodoRepository,
  PaginationOptions,
  TodoFilterOptions,
  PaginatedResult,
} from '@/todo/domain/repositories/todo.repository.interface';

/**
 * 인메모리 Todo Repository (Fake)
 *
 * 실제 DB 대신 배열에 데이터를 저장하는 간이 구현체입니다.
 * Mock보다 실제 동작에 가까우면서도, DB 연결이 필요 없습니다.
 *
 * 장점:
 * 1. Mock과 달리 실제 로직(필터링, 페이지네이션)을 검증할 수 있습니다
 * 2. beforeEach에서 Mock 설정을 반복할 필요가 없습니다
 * 3. 여러 Use Case를 연결한 시나리오 테스트에 유용합니다
 *
 * 단점:
 * 1. 구현체를 직접 만들어야 하는 추가 비용
 * 2. 실제 DB와 동작이 다를 수 있음 (SQL 쿼리 특성 등)
 */
export class InMemoryTodoRepository implements TodoRepository {
  private todos: Todo[] = [];
  private nextId = 1;

  findAll(
    pagination?: PaginationOptions,
    filter?: TodoFilterOptions,
  ): Promise<PaginatedResult<Todo>> {
    let filtered = [...this.todos];

    // 필터링
    if (filter?.status) {
      filtered = filtered.filter((t) => t.status === filter.status);
    }
    if (filter?.titleSearch) {
      filtered = filtered.filter((t) => t.title.includes(filter.titleSearch!));
    }

    // 페이지네이션
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const offset = (page - 1) * limit;
    const total = filtered.length;
    const data = filtered.slice(offset, offset + limit);

    return Promise.resolve({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  findById(id: number): Promise<Todo | null> {
    return Promise.resolve(this.todos.find((t) => t.id === id) ?? null);
  }

  findByStatus(status: TodoStatusType): Promise<Todo[]> {
    return Promise.resolve(this.todos.filter((t) => t.status === status));
  }

  save(todo: Todo): Promise<Todo> {
    // 새 Todo에 ID를 할당하여 reconstruct로 복원
    const savedTodo = Todo.reconstruct(
      this.nextId++,
      todo.title,
      todo.description,
      todo.status,
      todo.createdAt,
      todo.updatedAt,
    );
    this.todos.push(savedTodo);
    return Promise.resolve(savedTodo);
  }

  update(todo: Todo): Promise<Todo> {
    const index = this.todos.findIndex((t) => t.id === todo.id);
    if (index !== -1) {
      this.todos[index] = todo;
    }
    return Promise.resolve(todo);
  }

  delete(id: number): Promise<void> {
    this.todos = this.todos.filter((t) => t.id !== id);
    return Promise.resolve();
  }

  count(filter?: TodoFilterOptions): Promise<number> {
    let filtered = [...this.todos];

    if (filter?.status) {
      filtered = filtered.filter((t) => t.status === filter.status);
    }
    if (filter?.titleSearch) {
      filtered = filtered.filter((t) => t.title.includes(filter.titleSearch!));
    }

    return Promise.resolve(filtered.length);
  }

  /**
   * 테스트 유틸리티: 저장된 모든 Todo를 초기화합니다.
   */
  clear(): void {
    this.todos = [];
    this.nextId = 1;
  }

  /**
   * 테스트 유틸리티: 현재 저장된 Todo 수를 반환합니다.
   */
  get size(): number {
    return this.todos.length;
  }
}
