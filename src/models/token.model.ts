import { TokenPermission } from '../types/token-permission';

export class Token {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public name!: string;
  public description!: string;
  public permissions!: TokenPermission[];
  public ips: string[] | null = null;
  public expiresAt: Date | null = null;
  public activated!: boolean;
  public locked!: boolean;

  public constructor(
    data: Token & {
      createdAt: string;
      updatedAt: string;
      expiresAt: string | null;
    }
  ) {
    Object.assign(this, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });
  }
}
