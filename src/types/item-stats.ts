import { ItemEventType } from './item-event-type';
import { Metric, Stats } from './stats';

export type ItemStats = {
  events: Stats<{ types: Metric<ItemEventType> }>;
};
