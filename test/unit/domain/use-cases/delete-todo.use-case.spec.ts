// test/unit/domain/use-cases/delete-todo.use-case.spec.ts

import { DeleteTodoUseCase } from '@/todo/domain/use-cases/delete-todo.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TodoRepository } from '@/todo/domain/repositories/todo.repository.interface';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';

describe('DeleteTodoUseCase', () => {
  let useCase: DeleteTodoUseCase;
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

    useCase = new DeleteTodoUseCase(mockRepository);
  });

  it('존재하는 Todo를 삭제할 수 있다', async () => {
    const todo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(todo);
    mockRepository.delete.mockResolvedValue();

    await useCase.execute(1);

    expect(mockRepository.findById).toHaveBeenCalledWith(1);
    expect(mockRepository.delete).toHaveBeenCalledWith(1);
  });

  it('존재하지 않는 ID면 TodoNotFoundError를 던진다', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(TodoNotFoundError);

    expect(mockRepository.delete).not.toHaveBeenCalled();
  });

  it('반환값이 없다 (void)', async () => {
    const todo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(todo);
    mockRepository.delete.mockResolvedValue();

    const result = await useCase.execute(1);

    expect(result).toBeUndefined();
  });
});
