// test/fixtures/todo.fixture.ts

/**
 * Todo 테스트 데이터 Fixture
 *
 * 자주 사용하는 테스트 데이터를 한곳에서 관리한다.
 * 테스트에서 직접 사용하거나 Factory의 기본값으로 활용한다.
 */

// ─── 유효한 데이터 ───

export const VALID_TODO = {
  title: '장보기',
  description: '우유, 계란, 빵',
} as const;

export const VALID_TODO_WITHOUT_DESCRIPTION = {
  title: '운동하기',
} as const;

export const VALID_TODO_LONG_TITLE = {
  title: 'a'.repeat(100), // DTO 최대 길이 (100자)
  description: '긴 제목 테스트',
} as const;

export const VALID_TODO_SPECIAL_CHARS = {
  title: '특수문자 테스트: <script>alert("xss")</script>',
  description: '따옴표 \'single\' "double" & 앰퍼샌드',
} as const;

export const VALID_TODO_UNICODE = {
  title: '유니코드 테스트: 한국어 日本語 中文 emoji 🎉',
  description: '다국어 지원 확인',
} as const;

// ─── 유효하지 않은 데이터 ───

export const INVALID_TODO_EMPTY = {} as const;

export const INVALID_TODO_EMPTY_TITLE = {
  title: '',
} as const;

export const INVALID_TODO_NULL_TITLE = {
  title: null,
} as const;

export const INVALID_TODO_LONG_TITLE = {
  title: 'a'.repeat(101), // DTO 최대 길이(100) 초과
  description: '최대 길이 초과',
} as const;

export const INVALID_TODO_LONG_DESCRIPTION = {
  title: '유효한 제목',
  description: 'a'.repeat(501), // DTO 최대 길이(500) 초과
} as const;

export const INVALID_TODO_NUMBER_TITLE = {
  title: 12345,
} as const;

export const INVALID_TODO_EXTRA_FIELDS = {
  title: '유효한 제목',
  extraField: '허용되지 않는 필드',
  anotherExtra: true,
} as const;

// ─── 수정 데이터 ───

export const UPDATE_TITLE_ONLY = {
  title: '수정된 제목',
} as const;

export const UPDATE_DESCRIPTION_ONLY = {
  description: '수정된 설명',
} as const;

export const UPDATE_BOTH = {
  title: '새 제목',
  description: '새 설명',
} as const;

// ─── 목록 데이터 (대량 생성용) ───

export const MULTIPLE_TODOS = [
  { title: '아침 운동', description: '30분 조깅' },
  { title: '이메일 확인', description: '중요 메일 처리' },
  { title: '점심 회의', description: '프로젝트 진행 상황 공유' },
  { title: '코드 리뷰', description: 'PR #42 리뷰' },
  { title: '문서 작성', description: 'API 문서 업데이트' },
] as const;

// ─── 예상 응답 형태 ───
// expect.any() 등 Jest matcher는 any 타입을 반환하므로 ESLint 경고 비활성화
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

export const EXPECTED_TODO_SHAPE = {
  id: expect.any(Number),
  title: expect.any(String),
  // description은 string 또는 null이므로 toMatchObject에서 개별 검증 필요 시 별도 처리
  status: expect.any(String),
  isCompleted: expect.any(Boolean),
  availableTransitions: expect.any(Array),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

export const EXPECTED_PAGINATION_SHAPE = {
  data: expect.any(Array),
  meta: expect.objectContaining({
    total: expect.any(Number),
    page: expect.any(Number),
    limit: expect.any(Number),
    totalPages: expect.any(Number),
  }),
};

export const EXPECTED_ERROR_SHAPE = {
  statusCode: expect.any(Number),
  message: expect.anything(),
  error: expect.any(String),
};
