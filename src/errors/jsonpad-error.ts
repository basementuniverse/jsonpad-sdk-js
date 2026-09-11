import { ResponseMeta } from '../types/response-meta';

/**
 * Thrown when the API responds with an error status
 */
export class JSONPadError extends Error {
  /**
   * The HTTP status code, e.g. 429
   */
  public readonly status: number;

  /**
   * The jsonpad error code, e.g. 10007, or null if the response wasn't a
   * jsonpad error
   */
  public readonly code: number | null;

  /**
   * The jsonpad error name, e.g. 'RATE_LIMIT_EXCEEDED', or null if the
   * response wasn't a jsonpad error
   */
  public readonly errorName: string | null;

  /**
   * Rate limit and quota information from the response
   */
  public readonly meta: ResponseMeta;

  public constructor(status: number, body: string, meta: ResponseMeta) {
    // The message is the raw response body, as it was before this class
    // existed, so that anything already parsing it keeps working
    super(body);

    let parsed: any = null;
    try {
      parsed = JSON.parse(body);
    } catch {}

    this.name = 'JSONPadError';
    this.status = status;
    this.code = typeof parsed?.code === 'number' ? parsed.code : null;
    this.errorName = typeof parsed?.name === 'string' ? parsed.name : null;
    this.meta = meta;
  }

  /**
   * On a 429 response, how many seconds to wait before retrying
   */
  public get retryAfter(): number | null {
    return this.meta.retryAfter;
  }
}
