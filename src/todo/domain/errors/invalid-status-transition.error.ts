// src/todo/domain/errors/invalid-status-transition.error.ts

import { DomainError } from './domain.error';

/**
 * 허용되지 않는 상태 전이를 시도할 때 발생하는 에러
 *
 * Todo의 상태(status)는 정해진 규칙에 따라서만 변경할 수 있습니다.
 * 예를 들어 COMPLETED 상태에서 IN_PROGRESS로 직접 전이할 수 없습니다.
 *
 * 상태 전이 규칙:
 * - PENDING → IN_PROGRESS (허용)
 * - PENDING → COMPLETED (허용)
 * - IN_PROGRESS → COMPLETED (허용)
 * - IN_PROGRESS → PENDING (허용)
 * - COMPLETED → PENDING (허용)
 * - COMPLETED → IN_PROGRESS (불허)
 *
 * Presentation Layer에서 HTTP 409 Conflict로 매핑됩니다.
 */
export class InvalidStatusTransitionError extends DomainError {
  /** 현재 상태 */
  public readonly currentStatus: string;

  /** 전이하려고 시도한 상태 */
  public readonly targetStatus: string;

  constructor(currentStatus: string, targetStatus: string) {
    super(
      `상태를 '${currentStatus}'에서 '${targetStatus}'(으)로 변경할 수 없습니다.`,
      'INVALID_STATUS_TRANSITION',
    );
    this.currentStatus = currentStatus;
    this.targetStatus = targetStatus;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      currentStatus: this.currentStatus,
      targetStatus: this.targetStatus,
    };
  }
}
