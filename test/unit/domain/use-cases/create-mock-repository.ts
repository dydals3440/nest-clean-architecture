import { TodoRepository } from '@/todo/domain/repositories/todo.repository.interface';

export function createMockRepository(): jest.Mocked<TodoRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByStatus: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };
}
