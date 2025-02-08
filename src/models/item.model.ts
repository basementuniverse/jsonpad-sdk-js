export class Item<T = any> {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public data!: T;
  public description!: string;
  public version!: string;
  public readonly!: boolean;
  public activated!: boolean;
  public size!: number;

  public constructor(
    data: Item<T> & {
      createdAt: string;
      updatedAt: string;
    }
  ) {
    Object.assign(this, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }
}
