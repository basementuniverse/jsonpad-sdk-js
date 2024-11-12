import {
  EventStream,
  IndexEventType,
  ItemEventType,
  ListEventType,
} from '../types';
import { User } from './user.model';

export class Event {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public user!: User;
  public modelId!: string;
  public stream!: EventStream;
  public type!: ListEventType | ItemEventType | IndexEventType;
  public version!: string;
  public snapshot!: any;
  public attachments!: any;

  public constructor(
    data: Event & {
      createdAt: string;
      updatedAt: string;
      user: User & {
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
      user: new User(data.user),
    });
  }
}
