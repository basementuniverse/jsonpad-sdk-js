import { User } from './user.model';

export class List {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public user?: User;
  public name!: string;
  public description!: string;
  public pathName!: string;
  public schema!: any;
  public pinned!: boolean;
  public readonly!: boolean;
  public realtime!: boolean;
  public protected!: boolean;
  public indexable!: boolean;
  public generative!: boolean;
  public generativePrompt!: string;
  public activated!: boolean;
  public itemCount!: number;

  public constructor(
    data: List & {
      createdAt: string;
      updatedAt: string;
      user?: User & {
        createdAt: string;
        updatedAt: string;
        lastActiveAt: string | null;
      };
    }
  ) {
    Object.assign(this, {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      user: data.user ? new User(data.user) : undefined,
    });
  }
}
