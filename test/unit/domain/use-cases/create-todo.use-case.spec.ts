// test/unit/domain/use-cases/create-todo.use-case.spec.ts

import { CreateTodoUseCase } from '@/todo/domain/use-cases/create-todo.use-case';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { createMockRepository } from './create-mock-repository';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';

describe('CreateTodoUseCase', () => {
  let useCase: CreateTodoUseCase;
  let mockRepository: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    useCase = new CreateTodoUseCase(mockRepository);
  });

  it('제목과 설명으로 Todo를 생성하고 저장한다', async () => {
    // Arrange: save()가 ID가 할당된 Todo를 반환하도록 설정
    const savedTodo = Todo.reconstruct(
      1,
      '장보기',
      '우유 사기',
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.save.mockResolvedValue(savedTodo);

    // Act
    const result = await useCase.execute({
      title: '장보기',
      description: '우유 사기',
    });

    // Assert
    expect(result.id).toBe(1);
    expect(result.title).toBe('장보기');
    expect(result.description).toBe('우유 사기');
    expect(result.status).toBe(TODO_STATUS.PENDING);

    // save()가 호출되었는지 확인
    expect(mockRepository.save).toHaveBeenCalledTimes(1);

    // save()에 전달된 Todo가 올바른지 확인
    const savedArg = mockRepository.save.mock.calls[0][0];
    expect(savedArg.title).toBe('장보기');
    expect(savedArg.description).toBe('우유 사기');
    expect(savedArg.isNew()).toBe(true); // 아직 저장 전
  });

  it('설명 없이 Todo를 생성할 수 있다', async () => {
    const savedTodo = Todo.reconstruct(
      1,
      '장보기',
      null,
      'PENDING',
      new Date(),
      new Date(),
    );
    mockRepository.save.mockResolvedValue(savedTodo);

    const result = await useCase.execute({ title: '장보기' });

    expect(result.description).toBeNull();
  });

  it('빈 제목이면 InvalidTodoTitleError를 던진다 (Repository 호출 안 됨)', async () => {
    await expect(useCase.execute({ title: '' })).rejects.toThrow(
      InvalidTodoTitleError,
    );

    // 유효성 검증 실패이므로 Repository.save()가 호출되지 않아야 함
    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('100자 초과 제목이면 에러를 던진다', async () => {
    await expect(useCase.execute({ title: 'a'.repeat(101) })).rejects.toThrow(
      InvalidTodoTitleError,
    );

    expect(mockRepository.save).not.toHaveBeenCalled();
  });
});
