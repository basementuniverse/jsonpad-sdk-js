/**
 * The limits of a subscription plan. A null limit means there is no limit.
 */
export type SubscriptionPlan = {
  id: string;
  name: string;

  /**
   * The minimum gap between requests, in milliseconds
   */
  rateLimit: number | null;
  maxRequestsPerMinute: number | null;
  maxRequestsPerMonth: number | null;
  overdraftPercent: number;
  maxStorageBytes: number | null;
  maxLists: number | null;
  maxItemsPerList: number | null;
  maxIndexesPerList: number | null;
  maxItemSize: number | null;
  maxItemVersions: number | null;
  maxTokens: number | null;
  maxIdentities: number | null;
  maxRealtimeConnections: number | null;
  generativeAPI: boolean;
};
