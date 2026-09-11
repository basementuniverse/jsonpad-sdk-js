/**
 * Rate limit and quota information, read from the headers of an API response
 */
export type ResponseMeta = {
  /**
   * The HTTP status code
   */
  status: number;

  /**
   * The request id, which is useful when reporting a problem
   */
  requestId: string | null;

  /**
   * The per-minute rate limit, or null if the plan has no per-minute limit
   */
  rateLimit: {
    /**
     * How many requests the plan allows per minute
     */
    total: number;

    /**
     * How many more requests can be made in the rolling minute, after this one
     */
    remaining: number;
  } | null;

  /**
   * The monthly request quota, or null if the request wasn't metered
   */
  quota: {
    /**
     * The monthly allowance, excluding any overdraft or credits, or null if
     * the plan has no monthly limit
     */
    total: number | null;

    /**
     * How many requests are left before writes are refused, including any
     * overdraft and credits, or null if the plan has no monthly limit
     */
    remaining: number | null;

    /**
     * How many prepaid request credits are held, or null if the plan has no
     * monthly limit
     */
    credits: number | null;

    /**
     * When the monthly allowance resets
     */
    resetAt: Date;

    /**
     * True if the allowance and credits have run out, and this read was served
     * at the free tier's rate limit
     */
    degraded: boolean;
  } | null;

  /**
   * On a 429 response, how many seconds to wait before retrying
   */
  retryAfter: number | null;
};
