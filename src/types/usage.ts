/**
 * An account's usage for the current calendar month
 */
export type Usage = {
  periodStart: Date;
  periodEnd: Date;
  requestCount: number;
  blockedCount: number;
  requestAllowance: number | null;

  /**
   * Including any overdraft and credits, or null if the plan has no monthly
   * limit
   */
  requestsRemaining: number | null;
  overdraftAllowance: number;
  credits: number;
  storageBytes: number;
  storageAllowance: number | null;

  /**
   * True if the allowance and credits have run out, and reads are being served
   * at the free tier's rate limit
   */
  degraded: boolean;
};
