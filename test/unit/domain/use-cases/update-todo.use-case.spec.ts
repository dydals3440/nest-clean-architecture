// test/unit/domain/use-cases/update-todo.use-case.spec.ts

import { UpdateTodoUseCase } from '@/todo/domain/use-cases/update-todo.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { createMockRepository } from './create-mock-repository';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';
import { InvalidStatusTransitionError } from '@/todo/domain/errors/invalid-status-transition.error';

describe('UpdateTodoUseCase', () => {
  let useCase: UpdateTodoUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new UpdateTodoUseCase(mockRepository);
  });

  it('제목을 변경할 수 있다', async () => {
    const existingTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(existingTodo);
    mockRepository.update.mockResolvedValue(existingTodo);

    await useCase.execute({ id: 1, title: '마트 장보기' });

    expect(mockRepository.update).toHaveBeenCalledTimes(1);
    const updatedArg = mockRepository.update.mock.calls[0][0];
    expect(updatedArg.title).toBe('마트 장보기');
  });

  it('상태를 변경할 수 있다', async () => {
    const existingTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(existingTodo);
    mockRepository.update.mockResolvedValue(existingTodo);

    await useCase.execute({ id: 1, status: TODO_STATUS.IN_PROGRESS });

    const updatedArg = mockRepository.update.mock.calls[0][0];
    expect(updatedArg.status).toBe(TODO_STATUS.IN_PROGRESS);
  });

  it('존재하지 않는 ID면 TodoNotFoundError를 던진다', async () => {
    mockRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ id: 999, title: '새 제목' }),
    ).rejects.toThrow(TodoNotFoundError);

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('유효하지 않은 제목이면 InvalidTodoTitleError를 던진다', async () => {
    const existingTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(existingTodo);

    await expect(useCase.execute({ id: 1, title: '' })).rejects.toThrow(
      InvalidTodoTitleError,
    );

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('허용되지 않는 상태 전이면 InvalidStatusTransitionError를 던진다', async () => {
    const completedTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'COMPLETED',
      new Date(),
      new Date(),
    );
    mockRepository.findById.mockResolvedValue(completedTodo);

    await expect(
      useCase.execute({ id: 1, status: TODO_STATUS.IN_PROGRESS }),
    ).rejects.toThrow(InvalidStatusTransitionError);

    expect(mockRepository.update).not.toHaveBeenCalled();
  });
});
