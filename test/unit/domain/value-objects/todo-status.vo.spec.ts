// test/unit/domain/value-objects/todo-status.vo.spec.ts

import {
  TodoStatus,
  TODO_STATUS,
} from '@/todo/domain/value-objects/todo-status.vo';
import { InvalidStatusTransitionError } from '@/todo/domain/errors/invalid-status-transition.error';

describe('TodoStatus', () => {
  // ─── 생성 ───

  describe('create / default / fromString', () => {
    it('상태 값으로 생성할 수 있다', () => {
      const status = TodoStatus.create(TODO_STATUS.PENDING);

      expect(status.value).toBe(TODO_STATUS.PENDING);
    });

    it('default()는 PENDING 상태를 반환한다', () => {
      const status = TodoStatus.default();

      expect(status.value).toBe(TODO_STATUS.PENDING);
      expect(status.isPending()).toBe(true);
    });

    it('문자열에서 생성할 수 있다', () => {
      const status = TodoStatus.fromString('IN_PROGRESS');

      expect(status.value).toBe(TODO_STATUS.IN_PROGRESS);
    });

    it('유효하지 않은 문자열이면 에러를 던진다', () => {
      expect(() => TodoStatus.fromString('INVALID')).toThrow();
    });
  });

  // ─── 상태 전이 규칙 ───

  describe('상태 전이', () => {
    describe('PENDING에서', () => {
      const pending = TodoStatus.create(TODO_STATUS.PENDING);

      it('IN_PROGRESS로 전이할 수 있다', () => {
        const result = pending.transitionTo(TODO_STATUS.IN_PROGRESS);

        expect(result.value).toBe(TODO_STATUS.IN_PROGRESS);
      });

      it('COMPLETED로 전이할 수 있다', () => {
        const result = pending.transitionTo(TODO_STATUS.COMPLETED);

        expect(result.value).toBe(TODO_STATUS.COMPLETED);
      });

      it('같은 상태(PENDING)로는 전이할 수 없다', () => {
        expect(() => pending.transitionTo(TODO_STATUS.PENDING)).toThrow(
          InvalidStatusTransitionError,
        );
      });
    });

    describe('IN_PROGRESS에서', () => {
      const inProgress = TodoStatus.create(TODO_STATUS.IN_PROGRESS);

      it('COMPLETED로 전이할 수 있다', () => {
        const result = inProgress.transitionTo(TODO_STATUS.COMPLETED);

        expect(result.value).toBe(TODO_STATUS.COMPLETED);
      });

      it('PENDING으로 전이할 수 있다', () => {
        const result = inProgress.transitionTo(TODO_STATUS.PENDING);

        expect(result.value).toBe(TODO_STATUS.PENDING);
      });

      it('같은 상태(IN_PROGRESS)로는 전이할 수 없다', () => {
        expect(() => inProgress.transitionTo(TODO_STATUS.IN_PROGRESS)).toThrow(
          InvalidStatusTransitionError,
        );
      });
    });

    describe('COMPLETED에서', () => {
      const completed = TodoStatus.create(TODO_STATUS.COMPLETED);

      it('PENDING으로 전이할 수 있다', () => {
        const result = completed.transitionTo(TODO_STATUS.PENDING);

        expect(result.value).toBe(TODO_STATUS.PENDING);
      });

      it('IN_PROGRESS로는 전이할 수 없다', () => {
        expect(() => completed.transitionTo(TODO_STATUS.IN_PROGRESS)).toThrow(
          InvalidStatusTransitionError,
        );
      });

      it('같은 상태(COMPLETED)로는 전이할 수 없다', () => {
        expect(() => completed.transitionTo(TODO_STATUS.COMPLETED)).toThrow(
          InvalidStatusTransitionError,
        );
      });
    });
  });

  // ─── 불변성 ───

  describe('불변성', () => {
    it('transitionTo()는 원본을 변경하지 않고 새 인스턴스를 반환한다', () => {
      const original = TodoStatus.create(TODO_STATUS.PENDING);
      const transitioned = original.transitionTo(TODO_STATUS.IN_PROGRESS);

      expect(original.value).toBe(TODO_STATUS.PENDING); // 원본 불변
      expect(transitioned.value).toBe(TODO_STATUS.IN_PROGRESS); // 새 인스턴스
      expect(original).not.toBe(transitioned); // 다른 참조
    });
  });

  // ─── canTransitionTo ───

  describe('canTransitionTo', () => {
    it('허용된 전이는 true를 반환한다', () => {
      const pending = TodoStatus.create(TODO_STATUS.PENDING);

      expect(pending.canTransitionTo(TODO_STATUS.IN_PROGRESS)).toBe(true);
      expect(pending.canTransitionTo(TODO_STATUS.COMPLETED)).toBe(true);
    });

    it('허용되지 않은 전이는 false를 반환한다', () => {
      const completed = TodoStatus.create(TODO_STATUS.COMPLETED);

      expect(completed.canTransitionTo(TODO_STATUS.IN_PROGRESS)).toBe(false);
    });

    it('같은 상태로의 전이는 false를 반환한다', () => {
      const pending = TodoStatus.create(TODO_STATUS.PENDING);

      expect(pending.canTransitionTo(TODO_STATUS.PENDING)).toBe(false);
    });
  });

  // ─── 가용 전이 목록 ───

  describe('getAvailableTransitions', () => {
    it('PENDING에서 전이 가능한 상태: IN_PROGRESS, COMPLETED', () => {
      const pending = TodoStatus.create(TODO_STATUS.PENDING);

      expect(pending.getAvailableTransitions()).toEqual(
        expect.arrayContaining([
          TODO_STATUS.IN_PROGRESS,
          TODO_STATUS.COMPLETED,
        ]),
      );
    });

    it('COMPLETED에서 전이 가능한 상태: PENDING만', () => {
      const completed = TodoStatus.create(TODO_STATUS.COMPLETED);

      expect(completed.getAvailableTransitions()).toEqual([
        TODO_STATUS.PENDING,
      ]);
    });
  });

  // ─── 상태 확인 메서드 ───

  describe('상태 확인 메서드', () => {
    it('isPending()은 PENDING 상태에서만 true', () => {
      expect(TodoStatus.create(TODO_STATUS.PENDING).isPending()).toBe(true);
      expect(TodoStatus.create(TODO_STATUS.IN_PROGRESS).isPending()).toBe(
        false,
      );
      expect(TodoStatus.create(TODO_STATUS.COMPLETED).isPending()).toBe(false);
    });

    it('isInProgress()는 IN_PROGRESS 상태에서만 true', () => {
      expect(TodoStatus.create(TODO_STATUS.IN_PROGRESS).isInProgress()).toBe(
        true,
      );
      expect(TodoStatus.create(TODO_STATUS.PENDING).isInProgress()).toBe(false);
    });

    it('isCompleted()는 COMPLETED 상태에서만 true', () => {
      expect(TodoStatus.create(TODO_STATUS.COMPLETED).isCompleted()).toBe(true);
      expect(TodoStatus.create(TODO_STATUS.PENDING).isCompleted()).toBe(false);
    });
  });

  // ─── 동등성 ───

  describe('equals', () => {
    it('같은 상태면 동등하다', () => {
      const a = TodoStatus.create(TODO_STATUS.PENDING);
      const b = TodoStatus.create(TODO_STATUS.PENDING);

      expect(a.equals(b)).toBe(true);
    });

    it('다른 상태면 동등하지 않다', () => {
      const a = TodoStatus.create(TODO_STATUS.PENDING);
      const b = TodoStatus.create(TODO_STATUS.COMPLETED);

      expect(a.equals(b)).toBe(false);
    });
  });
});
