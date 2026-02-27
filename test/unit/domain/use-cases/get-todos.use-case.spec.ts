// test/unit/domain/use-cases/get-todos.use-case.spec.ts

import { GetTodosUseCase } from '@/todo/domain/use-cases/get-todos.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { createMockRepository } from './create-mock-repository';

describe('GetTodosUseCase', () => {
  let useCase: GetTodosUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new GetTodosUseCase(mockRepository);
  });

  it('페이지네이션된 Todo 목록을 반환한다', async () => {
    const todos = [
      Todo.reconstruct(1, '할 일 1', null, 'PENDING', new Date(), new Date()),
      Todo.reconstruct(2, '할 일 2', null, 'COMPLETED', new Date(), new Date()),
    ];

    mockRepository.findAll.mockResolvedValue({
      data: todos,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });

    const result = await useCase.execute({
      pagination: { page: 1, limit: 10 },
    });

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('필터 조건을 Repository에 전달한다', async () => {
    mockRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    await useCase.execute({
      pagination: { page: 1, limit: 5 },
      filter: { status: TODO_STATUS.PENDING },
    });

    expect(mockRepository.findAll).toHaveBeenCalledWith(
      { page: 1, limit: 5 },
      { status: TODO_STATUS.PENDING },
    );
  });

  it('빈 옵션으로도 호출할 수 있다', async () => {
    mockRepository.findAll.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    });

    const result = await useCase.execute({});

    expect(result.data).toHaveLength(0);
  });
});
