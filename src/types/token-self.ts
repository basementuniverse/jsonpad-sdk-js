import { Token } from '../models/token.model';
import { SubscriptionPlan } from './subscription-plan';
import { Usage } from './usage';

export type TokenSelf = {
  /**
   * The token making the request. The token value itself is not included.
   */
  token: Token;

  /**
   * The limits in effect for the request. If usage.degraded is true, then
   * rateLimit and maxRequestsPerMinute are the free tier's.
   */
  plan: SubscriptionPlan;

  /**
   * Usage across the whole account, not just this token
   */
  usage: Usage;
};
