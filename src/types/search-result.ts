import { Item } from '../models';

export type SearchResult = {
  relevance: number;
} & (
  | {
      id: string;
    }
  | {
      item: Item;
    }
);
