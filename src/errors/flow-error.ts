import { ResponseMeta } from '../types/response-meta';
import { JSONPadError } from './jsonpad-error';

/**
 * Thrown when an endpoint flow fails: a require node refused, an item it
 * needed wasn't found, or a write it made was refused. Nothing the run wrote
 * was kept
 *
 * `status` is the status the flow failed with (a require node's chosen
 * status, for example), and `message` is its message
 */
export class FlowError extends JSONPadError {
  /**
   * Why the run failed, e.g. REQUIRE_FAILED, NOT_FOUND, TIMEOUT
   */
  public readonly flowCode: string | null;

  /**
   * The node the run failed at, if it failed at one
   */
  public readonly node: string | null;

  /**
   * The run's id, as shown in the flow's run log in the dashboard
   */
  public readonly runId: string | null;

  public constructor(
    status: number,
    body: string,
    meta: ResponseMeta,
    runId: string | null = null
  ) {
    super(status, body, meta);

    this.name = 'FlowError';
    const details = this.details ?? {};
    this.flowCode = typeof details.code === 'string' ? details.code : null;
    this.node = typeof details.node === 'string' ? details.node : null;
    this.runId = runId;
  }

  /**
   * The message the flow failed with (JSONPadError's `message` is the raw
   * response body)
   */
  public get flowMessage(): string {
    try {
      return JSON.parse(this.message).message ?? this.message;
    } catch {
      return this.message;
    }
  }
}
