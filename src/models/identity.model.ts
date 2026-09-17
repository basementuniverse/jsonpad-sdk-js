import { User } from './user.model';

export class Identity {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public user?: User;
  public name!: string;
  public displayName: string | null = null;

  /**
   * Only included when the account owner fetches an identity, or when an
   * identity fetches itself
   */
  public email?: string | null;
  public emailVerified?: boolean;
  public hasPassword?: boolean;

  /**
   * The number of devices the identity is logged in on; only included when an
   * identity fetches itself
   */
  public sessionCount?: number;
  public tags!: string[];
  public group!: string;
  public lastLoginAt: Date | null = null;
  public activated!: boolean;

  public constructor(
    data: Identity & {
      createdAt: string;
      updatedAt: string;
      user?: User & {
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
      user: data.user ? new User(data.user) : undefined,
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : null,
    });
  }
}
