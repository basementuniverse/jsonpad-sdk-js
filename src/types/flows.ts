import { IdentityParameter } from './identity-parameter';
import { ResponseMeta } from './response-meta';

export type FlowMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RunFlowOptions = {
  /**
   * The flow's HTTP method. Defaults to POST. A GET flow is given its input
   * as query parameters, so every value arrives as a string
   */
  method?: FlowMethod;

  /**
   * Run as an identity (the token needs the run-with-identity permission),
   * or `{ ignore: true }` to run without the identity the SDK is signed in as
   */
  identity?: IdentityParameter;
};

export type RunPublicFlowOptions = {
  /**
   * The flow's HTTP method. Defaults to POST
   */
  method?: FlowMethod;
};

/**
 * What an endpoint flow responded with
 */
export type FlowResponse<T = any> = {
  /**
   * The status the flow's respond node chose (204 if it has none)
   */
  status: number;

  /**
   * The response body, or null for a response with no body
   */
  body: T | null;

  /**
   * Headers the flow's respond node set
   */
  headers: Record<string, string>;

  /**
   * The run's id, as shown in the flow's run log in the dashboard
   */
  runId: string | null;
  meta: ResponseMeta;
};
