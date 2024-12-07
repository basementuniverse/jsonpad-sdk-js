import { IdentityEventType } from './identity-event-type';
import { Metric, Stats } from './stats';

export type IdentityStats = {
  events: Stats<{ types: Metric<IdentityEventType> }>;
};
