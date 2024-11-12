import { IndexEventType } from './index-event-type';
import { Metric, Stats } from './stats';

export type IndexStats = {
  events: Stats<{ types: Metric<IndexEventType> }>;
};
