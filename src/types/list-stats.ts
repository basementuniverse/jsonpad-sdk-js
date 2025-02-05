import { ListEventType } from './list-event-type';
import { Metric, Stats } from './stats';

export type ListStats = {
  maxItems?: number | null;
  maxIndexes?: number | null;
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
