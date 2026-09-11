import { ResponseMeta } from '../types/response-meta';

/**
 * Dispatched by a JSONPad instance every time it receives a response, whether
 * or not the request succeeded
 *
 * This extends globalThis.Event rather than Event, because the SDK has an
 * Event model of its own that would otherwise shadow it in the bundled type
 * definitions.
 */
export class ResponseEvent extends globalThis.Event {
  public readonly detail: ResponseMeta;

  public constructor(detail: ResponseMeta) {
    super('response');
    this.detail = detail;
  }
}
