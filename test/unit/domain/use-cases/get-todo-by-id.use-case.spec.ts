// test/unit/domain/use-cases/get-todo-by-id.use-case.spec.ts

import { GetTodoByIdUseCase } from '@/todo/domain/use-cases/get-todo-by-id.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TodoRepository } from '@/todo/domain/repositories/todo.repository.interface';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';

describe('GetTodoByIdUseCase', () => {
  let useCase: GetTodoByIdUseCase;
  let mockRepository: jest.Mocked<TodoRepository>;

  beforeEach(() => {
    mockRepository = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByStatus: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    useCase = new GetTodoByIdUseCase(mockRepository);
  });

  it('존재하는 ID로 Todo를 조회할 수 있다', async () => {
    const todo = Todo.reconstruct(
      1,
      '장보기',
      '우유 사기',
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(todo);

    const result = await useCase.execute(1);

    expect(result.id).toBe(1);
    expect(result.title).toBe('장보기');
    expect(mockRepository.findById).toHaveBeenCalledWith(1);
  });

  it('존재하지 않는 ID면 TodoNotFoundError를 던진다', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(TodoNotFoundError);
  });

  it('에러에 요청한 ID가 포함된다', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const error = await useCase.execute(999).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TodoNotFoundError);
    expect((error as TodoNotFoundError).todoId).toBe(999);
  });
});
