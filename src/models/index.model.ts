import { IndexBuildStatus, IndexValueType, OrderDirection } from '../types';

export class Index {
  public id!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
  public name!: string;
  public description!: string;
  public tags!: string[];
  public pathName!: string;
  public pointer!: string;
  public valueType!: IndexValueType;
  public alias!: boolean;
  public sorting!: boolean;
  public filtering!: boolean;
  public searching!: boolean;

  /**
   * When true, the value at this index's pointer is removed from item data in
   * responses in token auth mode
   *
   * The value can still be written. An authenticated identity can read the
   * guarded values in the items it owns by passing includeGuarded
   */
  public guard!: boolean;

  public defaultOrderDirection!: OrderDirection;
  public activated!: boolean;

  /**
   * Whether the index's values have been built
   *
   * An index is built in the background when it's created and when its pointer
   * changes. Until it's 'ready', requests that depend on its values (filtering,
   * ordering, alias lookups and search) are refused with a 409 INDEX_BUILDING
   * or INDEX_BUILD_FAILED error. Use waitForIndex to wait for it
   */
  public buildStatus!: IndexBuildStatus;

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
