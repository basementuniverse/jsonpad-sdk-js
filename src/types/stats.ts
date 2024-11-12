export type Metric<T extends string = string> = {
  [key in T]: number;
};

export type Stats<T extends object> = {
  total: number;
  totalThisPeriod: number;
  metrics: ({
    date: Date;
    count: number;
  } & T)[];
};
