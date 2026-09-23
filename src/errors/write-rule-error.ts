import { ResponseMeta } from '../types/response-meta';
import { JSONPadError } from './jsonpad-error';

/**
 * Thrown when a list's write rules refuse a write
 *
 * `denied` tells the two cases apart:
 * - the rules didn't authorise the write at all (403). The message is always
 *   the same, on purpose
 * - the write was authorised but failed one of the list's checks (400). The
 *   message is the one the rule's author wrote
 */
export class WriteRuleError extends JSONPadError {
  /**
   * True when no rule allowed the write (403), false when it failed a check
   * (400)
   */
  public readonly denied: boolean;

  /**
   * The operation the rules refused: create, update or delete
   */
  public readonly operation: string | null;

  /**
   * The label of the rule that refused the write, if it has one and the API
   * says which
   */
  public readonly rule: string | null;

  /**
   * The line the rule starts on
   */
  public readonly line: number | null;

  public constructor(status: number, body: string, meta: ResponseMeta) {
    super(status, body, meta);

    this.name = 'WriteRuleError';
    this.denied = status === 403;

    const details = this.details ?? {};
    this.operation =
      typeof details.operation === 'string' ? details.operation : null;
    this.rule = typeof details.rule === 'string' ? details.rule : null;
    this.line = typeof details.line === 'number' ? details.line : null;
  }
}

/**
 * Thrown when an item has changed since the ETag sent as `ifMatch` (412)
 *
 * Fetch the item again, re-apply the change, and write it again.
 */
export class PreconditionFailedError extends JSONPadError {
  public constructor(status: number, body: string, meta: ResponseMeta) {
    super(status, body, meta);

    this.name = 'PreconditionFailedError';
  }
}

/**
 * Thrown when another write changed the item while this one was being made
 * (409), on a list with write rules
 *
 * The rules were checked against a version of the item that no longer exists,
 * so nothing was written. Fetch the item again and retry.
 */
export class ConflictError extends JSONPadError {
  public constructor(status: number, body: string, meta: ResponseMeta) {
    super(status, body, meta);

    this.name = 'ConflictError';
  }
}
