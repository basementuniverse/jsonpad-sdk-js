import { Index } from '../models';

/**
 * Thrown by waitForIndex when an index can't be used: its build failed, or it
 * didn't finish building before the timeout
 */
export class IndexBuildError extends Error {
  /**
   * Why the index isn't ready
   */
  public readonly reason: 'failed' | 'timeout';

  /**
   * The index as it was when we stopped waiting
   */
  public readonly index: Index;

  public constructor(reason: 'failed' | 'timeout', index: Index) {
    super(
      reason === 'failed'
        ? `Index "${index.pathName}" failed to build`
        : `Timed out waiting for index "${index.pathName}" to build`
    );

    this.name = 'IndexBuildError';
    this.reason = reason;
    this.index = index;
  }
}
