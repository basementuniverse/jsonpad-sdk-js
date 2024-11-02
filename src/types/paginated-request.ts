import { OrderDirection } from './order-direction';

export type PaginatedRequest<T extends string> = {
  page: number;
  limit: number;
  order: T;
  direction: OrderDirection;
};
