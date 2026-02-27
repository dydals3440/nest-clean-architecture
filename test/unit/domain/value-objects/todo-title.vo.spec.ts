import { TodoTitle } from '@/todo/domain/value-objects/todo-title.vo';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';

describe('TodoTitle', () => {
  // ─── 생성 성공 케이스 ───

  describe('create', () => {
    it('유효한 제목으로 생성할 수 있다', () => {
      const title = TodoTitle.create('장보기');

      expect(title.value).toBe('장보기');
    });

    it('앞뒤 공백이 자동으로 제거된다 (trim)', () => {
      const title = TodoTitle.create('  장보기  ');

      expect(title.value).toBe('장보기');
    });

    it('최소 길이(1자) 제목을 생성할 수 있다', () => {
      const title = TodoTitle.create('a');

      expect(title.value).toBe('a');
    });

    it('최대 길이(100자) 제목을 생성할 수 있다', () => {
      const title = TodoTitle.create('a'.repeat(100));

      expect(title.value).toBe('a'.repeat(100));
      expect(title.length).toBe(100);
    });
  });

  // ─── 생성 실패 케이스 ───

  describe('create - 실패', () => {
    it('빈 문자열이면 InvalidTodoTitleError를 던진다', () => {
      expect(() => TodoTitle.create('')).toThrow(InvalidTodoTitleError);
    });

    it('공백만 있는 문자열이면 에러를 던진다', () => {
      expect(() => TodoTitle.create('   ')).toThrow(InvalidTodoTitleError);
    });

    it('런타임에 null이 들어와도 에러를 던진다 (JS 호출자 방어)', () => {
      // TS는 string 타입을 강제하지만, JS에서 호출하거나
      // API 경계에서 타입 보장이 없는 경우를 대비한 방어 테스트
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => TodoTitle.create(null as any)).toThrow(
        InvalidTodoTitleError,
      );
    });

    it('런타임에 undefined가 들어와도 에러를 던진다 (JS 호출자 방어)', () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      expect(() => TodoTitle.create(undefined as any)).toThrow(
        InvalidTodoTitleError,
      );
    });

    it('101자 이상이면 에러를 던진다', () => {
      expect(() => TodoTitle.create('a'.repeat(101))).toThrow(
        InvalidTodoTitleError,
      );
    });

    it('에러 메시지에 위반 사유가 포함된다', () => {
      expect(() => TodoTitle.create('a'.repeat(101))).toThrow(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment
        expect.objectContaining({ reason: expect.stringContaining('100자') }),
      );
    });
  });

  // ─── reconstruct (DB 복원) ───

  describe('reconstruct', () => {
    it('검증 없이 TodoTitle을 복원할 수 있다', () => {
      const title = TodoTitle.reconstruct('DB에서 읽어온 제목');

      expect(title.value).toBe('DB에서 읽어온 제목');
    });
  });

  // ─── 동등성 비교 ───

  describe('equals', () => {
    it('같은 값이면 동등하다', () => {
      const a = TodoTitle.create('장보기');
      const b = TodoTitle.create('장보기');

      expect(a.equals(b)).toBe(true);
    });

    it('다른 값이면 동등하지 않다', () => {
      const a = TodoTitle.create('장보기');
      const b = TodoTitle.create('운동하기');

      expect(a.equals(b)).toBe(false);
    });
  });

  // ─── 기타 메서드 ───

  describe('toString / length', () => {
    it('toString()은 값을 그대로 반환한다', () => {
      const title = TodoTitle.create('장보기');

      expect(title.toString()).toBe('장보기');
    });

    it('length는 글자 수를 반환한다', () => {
      const title = TodoTitle.create('장보기');

      expect(title.length).toBe(3);
    });
  });
});
