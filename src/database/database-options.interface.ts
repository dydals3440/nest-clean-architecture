/**
 * 데이터베이스 연결 옵션 인터페이스
 *
 * DatabaseModule.forRoot()에 전달하는 옵션의 타입입니다.
 */
export interface DatabaseOptions {
  /**
   * PostgreSQL 데이터베이스 연결 URL
   * - 'postgresql://user:password@localhost:5432/todo_db': 로컬 개발
   * - 'postgresql://user:password@localhost:5432/todo_test': 테스트용
   */
  url: string;
}

/**
 * 비동기 데이터베이스 옵션 팩토리 인터페이스
 *
 * DatabaseModule.forRootAsync()에서 사용합니다.
 * 환경 변수나 ConfigService에서 설정을 가져올 때 유용합니다.
 */
export interface DatabaseAsyncOptions {
  /**
   * 이 Provider가 의존하는 모듈들
   */
  imports?: any[];

  /**
   * 팩토리 함수에 주입할 Provider들
   */
  inject?: any[];

  /**
   * 데이터베이스 옵션을 반환하는 팩토리 함수
   */
  useFactory: (...args: any[]) => Promise<DatabaseOptions> | DatabaseOptions;
}
