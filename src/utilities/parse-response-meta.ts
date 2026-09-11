import * as constants from '../constants';
import { ResponseMeta } from '../types/response-meta';

function parseNumber(value: string | null): number | null {
  if (value === null) {
    return null;
  }

  const number = parseInt(value, 10);

  return Number.isNaN(number) ? null : number;
}

/**
 * Read the rate limit and quota headers from a response
 *
 * In a browser these are only readable because the API lists them in
 * access-control-expose-headers.
 */
export default function parseResponseMeta(response: Response): ResponseMeta {
  const headers = response.headers;

  const rateLimitTotal = parseNumber(
    headers.get(constants.RATE_LIMIT_TOTAL_HEADER)
  );
  const rateLimitRemaining = parseNumber(
    headers.get(constants.RATE_LIMIT_REMAINING_HEADER)
  );
  const quotaReset = headers.get(constants.QUOTA_RESET_HEADER);

  return {
    status: response.status,
    requestId: headers.get(constants.REQUEST_ID_HEADER),
    rateLimit:
      rateLimitTotal !== null && rateLimitRemaining !== null
        ? {
            total: rateLimitTotal,
            remaining: rateLimitRemaining,
          }
        : null,

    // The reset header is set on every metered response, whereas the others
    // are only set when the plan has a monthly limit
    quota: quotaReset
      ? {
          total: parseNumber(headers.get(constants.QUOTA_TOTAL_HEADER)),
          remaining: parseNumber(headers.get(constants.QUOTA_REMAINING_HEADER)),
          credits: parseNumber(headers.get(constants.QUOTA_CREDITS_HEADER)),
          resetAt: new Date(quotaReset),
          degraded: headers.get(constants.QUOTA_DEGRADED_HEADER) === 'true',
        }
      : null,
    retryAfter: parseNumber(headers.get(constants.RETRY_AFTER_HEADER)),
  };
}
