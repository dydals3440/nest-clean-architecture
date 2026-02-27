// test/unit/domain/use-cases/toggle-todo.use-case.spec.ts

import { ToggleTodoUseCase } from '@/todo/domain/use-cases/toggle-todo.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { createMockRepository } from './create-mock-repository';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';

describe('ToggleTodoUseCase', () => {
  let useCase: ToggleTodoUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new ToggleTodoUseCase(mockRepository);
  });

  it('PENDING → COMPLETED로 토글된다', async () => {
    const pendingTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(pendingTodo);
    mockRepository.update.mockResolvedValue(pendingTodo);

    await useCase.execute(1);

    // toggleComplete() 호출 후 update()에 전달된 인자 확인
    const updatedArg = mockRepository.update.mock.calls[0][0];
    expect(updatedArg.status).toBe(TODO_STATUS.COMPLETED);
  });

  it('COMPLETED → PENDING으로 토글된다', async () => {
    const completedTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'COMPLETED',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(completedTodo);
    mockRepository.update.mockResolvedValue(completedTodo);

    await useCase.execute(1);

    const updatedArg = mockRepository.update.mock.calls[0][0];
    expect(updatedArg.status).toBe(TODO_STATUS.PENDING);
  });

  it('IN_PROGRESS → COMPLETED로 토글된다', async () => {
    const inProgressTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'IN_PROGRESS',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(inProgressTodo);
    mockRepository.update.mockResolvedValue(inProgressTodo);

    await useCase.execute(1);

    const updatedArg = mockRepository.update.mock.calls[0][0];
    expect(updatedArg.status).toBe(TODO_STATUS.COMPLETED);
  });

  it('존재하지 않는 ID면 TodoNotFoundError를 던진다', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(999)).rejects.toThrow(TodoNotFoundError);

    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
