import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { TodoService } from '../../application/services/todo.service';
import { CreateTodoDto } from '../../application/dto/create-todo.dto';
import { UpdateTodoDto } from '../../application/dto/update-todo.dto';
import {
  TodoResponse,
  PaginatedTodoResponse,
} from '../responses/todo.response';
import { TodoStatusType } from '../../domain/value-objects/todo-status.vo';

/**
 * Todo REST API 컨트롤러
 *
 * 모든 Todo 관련 HTTP 엔드포인트를 정의합니다.
 *
 * 엔드포인트 목록:
 * - POST   /todos          - Todo 생성
 * - GET    /todos          - Todo 목록 조회
 * - GET    /todos/:id      - Todo 단건 조회
 * - PUT    /todos/:id      - Todo 수정 (전체)
 * - PATCH  /todos/:id      - Todo 수정 (부분)
 * - PATCH  /todos/:id/toggle - Todo 완료 토글
 * - DELETE /todos/:id      - Todo 삭제
 *
 * 이 컨트롤러의 역할:
 * 1. HTTP 요청을 받아 적절한 Service 메서드를 호출합니다
 * 2. 응답을 TodoResponse 형식으로 변환합니다
 * 3. 도메인 에러는 DomainExceptionFilter에서 자동 처리됩니다
 *
 * 이 컨트롤러는 비즈니스 로직을 포함하지 않습니다.
 * 입출력 변환과 HTTP 관련 설정만 담당합니다.
 */
@Controller('todos')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  /**
   * POST /todos - 새로운 Todo를 생성합니다
   *
   * @Body()를 통해 HTTP 요청 body를 CreateTodoDto로 자동 변환합니다.
   * ValidationPipe가 DTO의 class-validator 데코레이터를 기반으로 유효성을 검증합니다.
   *
   * 성공 시 201 Created와 함께 생성된 Todo를 반환합니다.
   *
   * @param dto - 생성 요청 body
   * @returns 생성된 Todo 응답
   *
   * @example
   * ```
   * POST /todos
   * Content-Type: application/json
   *
   * {
   *   "title": "장보기",
   *   "description": "우유, 빵, 계란 사기"
   * }
   *
   * → 201 Created
   * {
   *   "id": 1,
   *   "title": "장보기",
   *   "description": "우유, 빵, 계란 사기",
   *   "status": "PENDING",
   *   "isCompleted": false,
   *   "createdAt": "2024-01-15T10:30:00.000Z",
   *   "updatedAt": "2024-01-15T10:30:00.000Z"
   * }
   * ```
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTodoDto): Promise<TodoResponse> {
    const todo = await this.todoService.create(dto);
    return TodoResponse.from(todo);
  }

  /**
   * GET /todos - Todo 목록을 조회합니다
   *
   * Query 파라미터로 페이지네이션과 필터링을 지원합니다.
   *
   * @param page - 페이지 번호 (기본: 1)
   * @param limit - 페이지당 항목 수 (기본: 10)
   * @param status - 상태 필터 (선택: PENDING, IN_PROGRESS, COMPLETED)
   * @param search - 제목 검색어 (선택)
   * @returns 페이지네이션된 Todo 목록 응답
   *
   * @example
   * ```
   * GET /todos?page=1&limit=10&status=PENDING&search=장보기
   *
   * → 200 OK
   * {
   *   "data": [ ... ],
   *   "meta": {
   *     "total": 25,
   *     "page": 1,
   *     "limit": 10,
   *     "totalPages": 3
   *   }
   * }
   * ```
   */
  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: TodoStatusType,
    @Query('search') search?: string,
  ): Promise<PaginatedTodoResponse> {
    const result = await this.todoService.findAll(page, limit, status, search);

    return PaginatedTodoResponse.from(result);
  }

  /**
   * GET /todos/:id - 단일 Todo를 조회합니다
   *
   * ParseIntPipe로 URL 파라미터를 자동으로 정수로 변환합니다.
   * 숫자가 아닌 값이 오면 400 Bad Request를 반환합니다.
   *
   * @param id - Todo ID (URL 파라미터)
   * @returns Todo 응답
   *
   * @example
   * ```
   * GET /todos/1
   *
   * → 200 OK
   * {
   *   "id": 1,
   *   "title": "장보기",
   *   ...
   * }
   *
   * GET /todos/999 (존재하지 않는 ID)
   *
   * → 404 Not Found
   * {
   *   "statusCode": 404,
   *   "error": "TODO_NOT_FOUND",
   *   "message": "ID가 999인 Todo를 찾을 수 없습니다."
   * }
   * ```
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<TodoResponse> {
    const todo = await this.todoService.findById(id);
    return TodoResponse.from(todo);
  }

  /**
   * PUT /todos/:id - Todo를 수정합니다 (전체 수정)
   *
   * PUT은 리소스의 전체 교체를 의미합니다.
   * 하지만 실제 구현에서는 PATCH와 동일하게 부분 업데이트를 수행합니다.
   * (RESTful 순수주의보다 실용성을 우선)
   *
   * @param id - Todo ID
   * @param dto - 수정 요청 body
   * @returns 수정된 Todo 응답
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    const todo = await this.todoService.update(id, dto);
    return TodoResponse.from(todo);
  }

  /**
   * PATCH /todos/:id - Todo를 부분 수정합니다
   *
   * PATCH는 리소스의 부분 수정을 의미합니다.
   * 전달된 필드만 변경되고, 전달되지 않은 필드는 유지됩니다.
   *
   * @param id - Todo ID
   * @param dto - 부분 수정 요청 body
   * @returns 수정된 Todo 응답
   *
   * @example
   * ```
   * PATCH /todos/1
   * Content-Type: application/json
   *
   * { "title": "마트 장보기" }
   *
   * → 200 OK
   * {
   *   "id": 1,
   *   "title": "마트 장보기",    // 변경됨
   *   "description": "우유 사기", // 유지됨
   *   "status": "PENDING",       // 유지됨
   *   ...
   * }
   * ```
   */
  @Patch(':id')
  async partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTodoDto,
  ): Promise<TodoResponse> {
    const todo = await this.todoService.update(id, dto);
    return TodoResponse.from(todo);
  }

  /**
   * PATCH /todos/:id/toggle - Todo 완료 상태를 토글합니다
   *
   * 완료(COMPLETED) ↔ 미완료(PENDING)를 전환합니다.
   * 프론트엔드의 체크박스 클릭에 대응합니다.
   *
   * @param id - Todo ID
   * @returns 토글된 Todo 응답
   *
   * @example
   * ```
   * PATCH /todos/1/toggle
   *
   * → 200 OK
   * {
   *   "id": 1,
   *   "status": "COMPLETED",  // PENDING이었으면 COMPLETED로
   *   "isCompleted": true,
   *   ...
   * }
   * ```
   */
  @Patch(':id/toggle')
  async toggle(@Param('id', ParseIntPipe) id: number): Promise<TodoResponse> {
    const todo = await this.todoService.toggle(id);
    return TodoResponse.from(todo);
  }

  /**
   * DELETE /todos/:id - Todo를 삭제합니다
   *
   * 성공 시 204 No Content를 반환합니다 (body 없음).
   *
   * @param id - Todo ID
   *
   * @example
   * ```
   * DELETE /todos/1
   *
   * → 204 No Content (body 없음)
   *
   * DELETE /todos/999 (존재하지 않는 ID)
   *
   * → 404 Not Found
   * {
   *   "statusCode": 404,
   *   "error": "TODO_NOT_FOUND",
   *   "message": "ID가 999인 Todo를 찾을 수 없습니다."
   * }
   * ```
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.todoService.remove(id);
  }
}
