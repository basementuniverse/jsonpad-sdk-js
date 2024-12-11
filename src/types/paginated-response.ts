export type PaginatedResponse<T = any> = {
  page: number;
  limit: number;
  total: number;
  data: T[];
};
