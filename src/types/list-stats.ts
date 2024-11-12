import { ListEventType } from './list-event-type';
import { Metric, Stats } from './stats';

export type ListStats = {
  maxItems: number;
  maxIndexes: number;
  items: Stats<{
    lists: {
      [id: string]: number;
    };
  }>;
  indexes: Stats<{
    lists: {
      [id: string]: number;
    };
  }>;
  events: Stats<{ types: Metric<ListEventType> }>;
};
