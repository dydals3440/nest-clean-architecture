import { Todo as PrismaTodo, Prisma } from '../../../generated/prisma/client';
import { Todo } from '../../domain/entities/todo.entity';

/**
 * Prisma 레코드와 도메인 엔티티 간의 매퍼
 *
 * 이 클래스는 두 가지 방향의 변환을 담당합니다:
 * 1. toDomain(): Prisma → 도메인 (쿼리 결과를 엔티티로)
 * 2. toPersistence(): 도메인 → Prisma (엔티티를 CREATE 입력으로)
 * 3. toUpdatePersistence(): 도메인 → Prisma (엔티티를 UPDATE 입력으로)
 *
 * Prisma는 `prisma generate`로 생성된 타입을 사용합니다:
 * - `PrismaTodo`: SELECT 결과 타입 (Todo 모델의 모든 필드)
 * - `Prisma.TodoCreateInput`: INSERT 입력 타입
 * - `Prisma.TodoUpdateInput`: UPDATE 입력 타입
 *
 * Mapper를 별도 클래스로 분리하는 이유:
 * 1. 변환 로직이 Repository에 섞이면 Repository가 비대해집니다
 * 2. DB 스키마가 변경되어도 Mapper만 수정하면 됩니다
 * 3. 변환 로직을 단독으로 테스트할 수 있습니다
 */
export class TodoMapper {
  /**
   * Prisma 레코드를 도메인 엔티티로 변환합니다.
   *
   * Prisma에서 조회한 결과(PrismaTodo)를 받아서
   * 도메인 엔티티(Todo)로 변환합니다.
   *
   * Todo.reconstruct()를 사용하여 유효성 검증을 생략합니다.
   * DB에 이미 저장된 데이터는 유효성이 보장되어 있기 때문입니다.
   *
   * Prisma는 DateTime 필드를 자동으로 Date 객체로 변환하므로,
   * 별도의 날짜 변환이 필요 없습니다.
   *
   * @param record - Prisma에서 조회한 레코드
   * @returns 도메인 엔티티
   *
   * @example
   * ```typescript
   * const dbRecord: PrismaTodo = {
   *   id: 1,
   *   title: '장보기',
   *   description: null,
   *   status: 'PENDING',
   *   createdAt: new Date('2024-01-15T10:30:00.000Z'),
   *   updatedAt: new Date('2024-01-15T10:30:00.000Z'),
   * };
   *
   * const entity = TodoMapper.toDomain(dbRecord);
   * console.log(entity.title);  // '장보기'
   * console.log(entity.status); // 'PENDING'
   * ```
   */
  static toDomain(record: PrismaTodo): Todo {
    return Todo.reconstruct(
      record.id,
      record.title,
      record.description,
      record.status,
      record.createdAt, // Prisma가 이미 Date 객체로 변환
      record.updatedAt, // Prisma가 이미 Date 객체로 변환
    );
  }

  /**
   * 여러 Prisma 레코드를 도메인 엔티티 배열로 변환합니다.
   *
   * @param records - Prisma에서 조회한 레코드 배열
   * @returns 도메인 엔티티 배열
   */
  static toDomainList(records: PrismaTodo[]): Todo[] {
    return records.map((record) => TodoMapper.toDomain(record));
  }

  /**
   * 도메인 엔티티를 Prisma CREATE 입력으로 변환합니다.
   *
   * 새로운 Todo를 DB에 저장할 때 사용합니다.
   * id는 DB에서 자동 생성되므로 포함하지 않습니다.
   * createdAt, updatedAt은 Prisma 스키마의 @default(now())와
   * @updatedAt이 자동 처리하므로 포함하지 않습니다.
   *
   * @param entity - 도메인 엔티티
   * @returns Prisma CREATE 입력 객체
   *
   * @example
   * ```typescript
   * const todo = Todo.create('장보기', '우유 사기');
   * const createData = TodoMapper.toPersistence(todo);
   * // {
   * //   title: '장보기',
   * //   description: '우유 사기',
   * //   status: 'PENDING',
   * // }
   * ```
   */
  static toPersistence(entity: Todo): Prisma.TodoCreateInput {
    return {
      title: entity.title,
      description: entity.description,
      status: entity.status,
    };
  }

  /**
   * 도메인 엔티티를 Prisma UPDATE 입력으로 변환합니다.
   *
   * 기존 Todo의 변경 사항을 DB에 반영할 때 사용합니다.
   * id와 createdAt은 변경하지 않습니다.
   * updatedAt은 @updatedAt 속성이 자동 갱신합니다.
   *
   * @param entity - 도메인 엔티티
   * @returns Prisma UPDATE 입력 객체
   */
  static toUpdatePersistence(entity: Todo): Prisma.TodoUpdateInput {
    return {
      title: entity.title,
      description: entity.description,
      status: entity.status,
    };
  }
}
