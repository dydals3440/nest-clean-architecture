import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { InvalidTodoTitleError } from '@/todo/domain/errors/invalid-todo-title.error';
import { InvalidStatusTransitionError } from '@/todo/domain/errors/invalid-status-transition.error';

describe('Todo Entity', () => {
  // ─── 생성 (create) ───

  describe('create', () => {
    it('제목만으로 Todo를 생성할 수 있다', () => {
      const todo = Todo.create('장보기');

      expect(todo.id).toBeNull(); // 아직 저장 안 됨
      expect(todo.title).toBe('장보기');
      expect(todo.description).toBeNull();
      expect(todo.status).toBe(TODO_STATUS.PENDING); // 초기 상태
      expect(todo.createdAt).toBeInstanceOf(Date);
      expect(todo.updatedAt).toBeInstanceOf(Date);
    });

    it('제목과 설명으로 Todo를 생성할 수 있다', () => {
      const todo = Todo.create('장보기', '우유, 빵, 계란');

      expect(todo.title).toBe('장보기');
      expect(todo.description).toBe('우유, 빵, 계란');
    });

    it('description이 null이면 null로 저장된다', () => {
      const todo = Todo.create('장보기', null);

      expect(todo.description).toBeNull();
    });

    it('유효하지 않은 제목이면 InvalidTodoTitleError를 던진다', () => {
      expect(() => Todo.create('')).toThrow(InvalidTodoTitleError);
      expect(() => Todo.create('   ')).toThrow(InvalidTodoTitleError);
      expect(() => Todo.create('a'.repeat(101))).toThrow(InvalidTodoTitleError);
    });

    it('새로 생성된 Todo는 isNew()가 true다', () => {
      const todo = Todo.create('장보기');

      expect(todo.isNew()).toBe(true);
    });
  });

  // ─── 복원 (reconstruct) ───

  describe('reconstruct', () => {
    it('DB 데이터로 Todo를 복원할 수 있다', () => {
      const createdAt = new Date('2026-01-01');
      const updatedAt = new Date('2026-01-02');

      const todo = Todo.reconstruct(
        1,
        '장보기',
        '우유 사기',
        'PENDING',
        createdAt,
        updatedAt,
      );

      expect(todo.id).toBe(1);
      expect(todo.title).toBe('장보기');
      expect(todo.description).toBe('우유 사기');
      expect(todo.status).toBe(TODO_STATUS.PENDING);
      expect(todo.createdAt).toBe(createdAt);
      expect(todo.updatedAt).toBe(updatedAt);
    });

    it('복원된 Todo는 isNew()가 false다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'PENDING',
        new Date(),
        new Date(),
      );

      expect(todo.isNew()).toBe(false);
    });
  });

  // ─── complete() ───

  describe('complete', () => {
    it('PENDING 상태에서 완료할 수 있다', () => {
      const todo = Todo.create('장보기');

      todo.complete();

      expect(todo.status).toBe(TODO_STATUS.COMPLETED);
      expect(todo.isCompleted()).toBe(true);
    });

    it('IN_PROGRESS 상태에서 완료할 수 있다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'IN_PROGRESS',
        new Date(),
        new Date(),
      );

      todo.complete();

      expect(todo.status).toBe(TODO_STATUS.COMPLETED);
    });

    it('이미 완료된 Todo에 complete()를 호출하면 아무 일도 일어나지 않는다 (멱등성)', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'COMPLETED',
        new Date(),
        new Date(),
      );
      const updatedAtBefore = todo.updatedAt;

      todo.complete();

      expect(todo.status).toBe(TODO_STATUS.COMPLETED);
      expect(todo.updatedAt).toBe(updatedAtBefore); // updatedAt 변경 안 됨
    });
  });

  // ─── uncomplete() ───

  describe('uncomplete', () => {
    it('COMPLETED 상태에서 PENDING으로 되돌릴 수 있다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'COMPLETED',
        new Date(),
        new Date(),
      );

      todo.uncomplete();

      expect(todo.status).toBe(TODO_STATUS.PENDING);
    });

    it('IN_PROGRESS 상태에서 PENDING으로 되돌릴 수 있다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'IN_PROGRESS',
        new Date(),
        new Date(),
      );

      todo.uncomplete();

      expect(todo.status).toBe(TODO_STATUS.PENDING);
    });

    it('이미 PENDING 상태면 아무 일도 일어나지 않는다 (멱등성)', () => {
      const todo = Todo.create('장보기');
      const updatedAtBefore = todo.updatedAt;

      todo.uncomplete();

      expect(todo.status).toBe(TODO_STATUS.PENDING);
      expect(todo.updatedAt).toBe(updatedAtBefore);
    });
  });

  // ─── toggleComplete() ───

  describe('toggleComplete', () => {
    it('PENDING → COMPLETED로 토글된다', () => {
      const todo = Todo.create('장보기');

      todo.toggleComplete();

      expect(todo.status).toBe(TODO_STATUS.COMPLETED);
    });

    it('COMPLETED → PENDING으로 토글된다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'COMPLETED',
        new Date(),
        new Date(),
      );

      todo.toggleComplete();

      expect(todo.status).toBe(TODO_STATUS.PENDING);
    });

    it('IN_PROGRESS → COMPLETED로 토글된다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'IN_PROGRESS',
        new Date(),
        new Date(),
      );

      todo.toggleComplete();

      expect(todo.status).toBe(TODO_STATUS.COMPLETED);
    });
  });

  // ─── changeStatus() ───

  describe('changeStatus', () => {
    it('허용된 상태 전이가 동작한다', () => {
      const todo = Todo.create('장보기');

      todo.changeStatus(TODO_STATUS.IN_PROGRESS);

      expect(todo.status).toBe(TODO_STATUS.IN_PROGRESS);
    });

    it('허용되지 않은 상태 전이는 에러를 던진다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        null,
        'COMPLETED',
        new Date(),
        new Date(),
      );

      expect(() => todo.changeStatus(TODO_STATUS.IN_PROGRESS)).toThrow(
        InvalidStatusTransitionError,
      );
    });

    it('같은 상태로 변경하면 아무 일도 일어나지 않는다 (멱등성)', () => {
      const todo = Todo.create('장보기');
      const updatedAtBefore = todo.updatedAt;

      todo.changeStatus(TODO_STATUS.PENDING);

      expect(todo.updatedAt).toBe(updatedAtBefore);
    });
  });

  // ─── updateTitle() ───

  describe('updateTitle', () => {
    it('새 제목으로 변경할 수 있다', () => {
      const todo = Todo.create('장보기');

      todo.updateTitle('마트 장보기');

      expect(todo.title).toBe('마트 장보기');
    });

    it('유효하지 않은 제목이면 에러를 던진다', () => {
      const todo = Todo.create('장보기');

      expect(() => todo.updateTitle('')).toThrow(InvalidTodoTitleError);
    });

    it('같은 제목으로 변경하면 updatedAt이 변경되지 않는다', () => {
      const todo = Todo.create('장보기');
      const updatedAtBefore = todo.updatedAt;

      todo.updateTitle('장보기');

      expect(todo.updatedAt).toBe(updatedAtBefore);
    });
  });

  // ─── updateDescription() ───

  describe('updateDescription', () => {
    it('설명을 변경할 수 있다', () => {
      const todo = Todo.create('장보기');

      todo.updateDescription('우유, 빵 사기');

      expect(todo.description).toBe('우유, 빵 사기');
    });

    it('null을 전달하면 설명을 제거할 수 있다', () => {
      const todo = Todo.create('장보기', '우유 사기');

      todo.updateDescription(null);

      expect(todo.description).toBeNull();
    });

    it('빈 문자열을 전달하면 null로 처리된다', () => {
      const todo = Todo.create('장보기', '우유 사기');

      todo.updateDescription('');

      expect(todo.description).toBeNull();
    });
  });

  // ─── update() (부분 업데이트) ───

  describe('update', () => {
    it('제목만 변경할 수 있다', () => {
      const todo = Todo.create('장보기', '우유 사기');

      todo.update({ title: '마트 장보기' });

      expect(todo.title).toBe('마트 장보기');
      expect(todo.description).toBe('우유 사기'); // 유지
    });

    it('상태만 변경할 수 있다', () => {
      const todo = Todo.create('장보기');

      todo.update({ status: TODO_STATUS.IN_PROGRESS });

      expect(todo.status).toBe(TODO_STATUS.IN_PROGRESS);
      expect(todo.title).toBe('장보기'); // 유지
    });

    it('여러 필드를 동시에 변경할 수 있다', () => {
      const todo = Todo.create('장보기');

      todo.update({
        title: '마트 장보기',
        description: '우유, 빵',
        status: TODO_STATUS.IN_PROGRESS,
      });

      expect(todo.title).toBe('마트 장보기');
      expect(todo.description).toBe('우유, 빵');
      expect(todo.status).toBe(TODO_STATUS.IN_PROGRESS);
    });

    it('undefined 필드는 변경하지 않는다', () => {
      const todo = Todo.create('장보기', '우유 사기');

      todo.update({ title: undefined, description: undefined });

      expect(todo.title).toBe('장보기');
      expect(todo.description).toBe('우유 사기');
    });
  });

  // ─── 동등성 비교 ───

  describe('equals', () => {
    it('같은 ID의 두 엔티티는 동등하다', () => {
      const a = Todo.reconstruct(
        1,
        '장보기',
        null,
        'PENDING',
        new Date(),
        new Date(),
      );
      const b = Todo.reconstruct(
        1,
        '운동하기',
        null,
        'COMPLETED',
        new Date(),
        new Date(),
      );

      expect(a.equals(b)).toBe(true); // ID만 같으면 동등
    });

    it('다른 ID의 두 엔티티는 동등하지 않다', () => {
      const a = Todo.reconstruct(
        1,
        '장보기',
        null,
        'PENDING',
        new Date(),
        new Date(),
      );
      const b = Todo.reconstruct(
        2,
        '장보기',
        null,
        'PENDING',
        new Date(),
        new Date(),
      );

      expect(a.equals(b)).toBe(false);
    });

    it('둘 다 새 엔티티(id=null)이면 참조 비교한다', () => {
      const a = Todo.create('장보기');
      const b = Todo.create('장보기');

      expect(a.equals(a)).toBe(true); // 같은 참조
      expect(a.equals(b)).toBe(false); // 다른 참조
    });
  });

  // ─── 조회 메서드 ───

  describe('조회 메서드', () => {
    it('canTransitionTo()가 올바르게 동작한다', () => {
      const todo = Todo.create('장보기');

      expect(todo.canTransitionTo(TODO_STATUS.IN_PROGRESS)).toBe(true);
      expect(todo.canTransitionTo(TODO_STATUS.COMPLETED)).toBe(true);
    });

    it('getAvailableTransitions()이 가능한 상태 목록을 반환한다', () => {
      const todo = Todo.create('장보기');

      const transitions = todo.getAvailableTransitions();

      expect(transitions).toContain(TODO_STATUS.IN_PROGRESS);
      expect(transitions).toContain(TODO_STATUS.COMPLETED);
    });
  });
});
