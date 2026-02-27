import { DomainError } from '@/todo/domain/errors/domain.error';
import { TodoNotFoundError } from '@/todo/domain/errors/todo-not-found.error';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';
import { InvalidStatusTransitionError } from '@/todo/domain/errors/invalid-status-transition.error';

describe('Domain Errors', () => {
  // ─── TodoNotFoundError ───

  describe('TodoNotFoundError', () => {
    it('DomainError를 상속한다', () => {
      const error = new TodoNotFoundError(42);

      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(Error);
    });

    it('올바른 속성을 가진다', () => {
      const error = new TodoNotFoundError(42);

      expect(error.code).toBe('TODO_NOT_FOUND');
      expect(error.todoId).toBe(42);
      expect(error.message).toContain('42');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('toJSON()이 todoId를 포함한다', () => {
      const error = new TodoNotFoundError(42);
      const json = error.toJSON();

      expect(json).toMatchObject({
        name: 'TodoNotFoundError',
        code: 'TODO_NOT_FOUND',
        todoId: 42,
      });
      expect(json.message).toBeDefined();
      expect(json.timestamp).toBeDefined();
    });
  });

  // ─── InvalidTodoTitleError ───

  describe('InvalidTodoTitleError', () => {
    it('DomainError를 상속한다', () => {
      const error = new InvalidTodoTitleError('', '빈 제목');

      expect(error).toBeInstanceOf(DomainError);
    });

    it('올바른 속성을 가진다', () => {
      const error = new InvalidTodoTitleError('bad', '너무 짧음');

      expect(error.code).toBe('INVALID_TODO_TITLE');
      expect(error.invalidTitle).toBe('bad');
      expect(error.reason).toBe('너무 짧음');
    });

    describe('팩토리 메서드', () => {
      it('empty()는 빈 제목 에러를 생성한다', () => {
        const error = InvalidTodoTitleError.empty();

        expect(error.invalidTitle).toBe('');
        expect(error.reason).toContain('비어있을 수 없습니다');
      });

      it('tooLong()은 최대 길이 초과 에러를 생성한다', () => {
        const longTitle = 'a'.repeat(101);
        const error = InvalidTodoTitleError.tooLong(longTitle, 100);

        expect(error.invalidTitle).toBe(longTitle);
        expect(error.reason).toContain('100자');
      });

      it('tooShort()는 최소 길이 미만 에러를 생성한다', () => {
        const error = InvalidTodoTitleError.tooShort('', 1);

        expect(error.reason).toContain('1자');
      });
    });
  });

  // ─── InvalidStatusTransitionError ───

  describe('InvalidStatusTransitionError', () => {
    it('올바른 속성을 가진다', () => {
      const error = new InvalidStatusTransitionError(
        'COMPLETED',
        'IN_PROGRESS',
      );

      expect(error.code).toBe('INVALID_STATUS_TRANSITION');
      expect(error.currentStatus).toBe('COMPLETED');
      expect(error.targetStatus).toBe('IN_PROGRESS');
    });

    it('toJSON()에 상태 정보가 포함된다', () => {
      const error = new InvalidStatusTransitionError(
        'COMPLETED',
        'IN_PROGRESS',
      );
      const json = error.toJSON();

      expect(json).toMatchObject({
        currentStatus: 'COMPLETED',
        targetStatus: 'IN_PROGRESS',
      });
    });
  });
});
