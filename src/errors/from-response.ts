import { ResponseMeta } from '../types/response-meta';
import { JSONPadError } from './jsonpad-error';
import {
  ConflictError,
  PreconditionFailedError,
  WriteRuleError,
} from './write-rule-error';

/**
 * The most specific error for an API response
 */
export function errorFromResponse(
  status: number,
  body: string,
  meta: ResponseMeta
): JSONPadError {
  const error = new JSONPadError(status, body, meta);

  switch (error.errorName) {
    case 'WRITE_RULE_DENIED':
    case 'WRITE_RULE_FAILED':
      return new WriteRuleError(status, body, meta);
    case 'ITEM_PRECONDITION_FAILED':
      return new PreconditionFailedError(status, body, meta);
    case 'ITEM_CONFLICT':
      return new ConflictError(status, body, meta);
    default:
      return error;
  }
}
