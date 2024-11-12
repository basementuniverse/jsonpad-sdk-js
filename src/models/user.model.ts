export class User {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public lastActiveAt!: Date | null;
  public activated!: boolean;
  public displayName!: string;
  public description!: string;

  public constructor(
    data: User & {
      createdAt: string;
      updatedAt: string;
      lastActiveAt: string | null;
    }
  ) {
    Object.assign(this, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      lastActiveAt: data.lastActiveAt ? new Date(data.lastActiveAt) : null,
    });
  }
}
