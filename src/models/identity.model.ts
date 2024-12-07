import { User } from './user.model';

export class Identity {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public user!: User;
  public name!: string;
  public group!: string;
  public lastLoginAt: Date | null = null;
  public activated!: boolean;

  public constructor(
    data: Identity & {
      createdAt: string;
      updatedAt: string;
      user: User & {
        createdAt: string;
        updatedAt: string;
        lastActiveAt: string | null;
      };
      lastLoginAt: string | null;
    }
  ) {
    Object.assign(this, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      user: new User(data.user),
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
    });
  }
}
