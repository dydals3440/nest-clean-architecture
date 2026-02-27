import { TodoMapper } from '@/todo/infrastructure/persistence/todo.mapper';
import { Todo } from '@/todo/domain/entities/todo.entity';
import { TODO_STATUS } from '@/todo/domain/value-objects/todo-status.vo';
import { Todo as PrismaTodo } from '../../../src/generated/prisma/client';

describe('TodoMapper', () => {
  // ─── toDomain ───

  describe('toDomain', () => {
    it('DB 레코드를 도메인 엔티티로 변환한다', () => {
      const record: PrismaTodo = {
        id: 1,
        title: '장보기',
        description: '우유 사기',
        status: 'PENDING',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T12:00:00.000Z'),
      };

      const entity = TodoMapper.toDomain(record);

      expect(entity).toBeInstanceOf(Todo);
      expect(entity.id).toBe(1);
      expect(entity.title).toBe('장보기');
      expect(entity.description).toBe('우유 사기');
      expect(entity.status).toBe(TODO_STATUS.PENDING);
      expect(entity.createdAt).toBeInstanceOf(Date);
      expect(entity.updatedAt).toBeInstanceOf(Date);
    });

    it('description이 null인 레코드도 변환한다', () => {
      const record: PrismaTodo = {
        id: 1,
        title: '장보기',
        description: null,
        status: 'COMPLETED',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-01T12:00:00.000Z'),
      };

      const entity = TodoMapper.toDomain(record);

      expect(entity.description).toBeNull();
      expect(entity.status).toBe(TODO_STATUS.COMPLETED);
    });

    it('날짜가 Date 객체로 올바르게 전달된다', () => {
      const record: PrismaTodo = {
        id: 1,
        title: '장보기',
        description: null,
        status: 'PENDING',
        createdAt: new Date('2026-06-15T09:30:00.000Z'),
        updatedAt: new Date('2026-06-15T10:00:00.000Z'),
      };

      const entity = TodoMapper.toDomain(record);

      expect(entity.createdAt.toISOString()).toBe('2026-06-15T09:30:00.000Z');
      expect(entity.updatedAt.toISOString()).toBe('2026-06-15T10:00:00.000Z');
    });
  });

  // ─── toDomainList ───

  describe('toDomainList', () => {
    it('여러 레코드를 엔티티 배열로 변환한다', () => {
      const records: PrismaTodo[] = [
        {
          id: 1,
          title: '할 일 1',
          description: null,
          status: 'PENDING',
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01'),
        },
        {
          id: 2,
          title: '할 일 2',
          description: '설명',
          status: 'COMPLETED',
          createdAt: new Date('2026-01-02'),
          updatedAt: new Date('2026-01-02'),
        },
      ];

      const entities = TodoMapper.toDomainList(records);

      expect(entities).toHaveLength(2);
      expect(entities[0]).toBeInstanceOf(Todo);
      expect(entities[1]).toBeInstanceOf(Todo);
    });

    it('빈 배열이면 빈 배열을 반환한다', () => {
      const entities = TodoMapper.toDomainList([]);

      expect(entities).toEqual([]);
    });
  });

  // ─── toPersistence ───

  describe('toPersistence', () => {
    it('도메인 엔티티를 CREATE용 데이터로 변환한다', () => {
      const todo = Todo.create('장보기', '우유 사기');

      const persistence = TodoMapper.toPersistence(todo);

      expect(persistence.title).toBe('장보기');
      expect(persistence.description).toBe('우유 사기');
      expect(persistence.status).toBe('PENDING');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((persistence as any).id).toBeUndefined(); // id는 포함하지 않음
    });
  });

  // ─── toUpdatePersistence ───

  describe('toUpdatePersistence', () => {
    it('도메인 엔티티를 UPDATE용 데이터로 변환한다', () => {
      const todo = Todo.reconstruct(
        1,
        '장보기',
        '우유 사기',
        'IN_PROGRESS',
        new Date(),
        new Date(),
      );

      const updateData = TodoMapper.toUpdatePersistence(todo);

      expect(updateData.title).toBe('장보기');
      expect(updateData.description).toBe('우유 사기');
      expect(updateData.status).toBe('IN_PROGRESS');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((updateData as any).id).toBeUndefined(); // id 없음
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect((updateData as any).createdAt).toBeUndefined(); // createdAt 없음
    });
  });
});
