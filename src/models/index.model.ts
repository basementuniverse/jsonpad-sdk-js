import { IndexValueType, OrderDirection } from '../types';

export class Index {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public name!: string;
  public description!: string;
  public pathName!: string;
  public pointer!: string;
  public valueType!: IndexValueType;
  public alias!: boolean;
  public sorting!: boolean;
  public filtering!: boolean;
  public searching!: boolean;
  public defaultOrderDirection!: OrderDirection;
  public activated!: boolean;

  public constructor(
    data: Index & {
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
