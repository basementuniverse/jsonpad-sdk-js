import { IndexBuildStatus } from './index-build-status';
import { IndexValueType } from './index-value-type';
import { OrderDirection } from './order-direction';

/**
 * An index in a schema sync document. Fields that are left out are left as
 * they are
 */
export type SyncSchemaIndexDefinition = {
  name?: string;
  description?: string;
  tags?: string[];

  /**
   * Required when the index is created
   */
  pointer?: string;
  valueType?: IndexValueType;
  alias?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  searching?: boolean;
  guard?: boolean;
  defaultOrderDirection?: OrderDirection;
};

/**
 * A list in a schema sync document. Fields that are left out are left as they
 * are
 */
export type SyncSchemaListDefinition = {
  name?: string;
  description?: string;
  tags?: string[];
  schema?: Record<string, any> | null;
  readonly?: boolean;
  realtime?: boolean;
  protected?: boolean;
  indexable?: boolean;
  generative?: boolean;
  generativePrompt?: string | null;

  /**
   * Indexes, keyed by path name
   */
  indexes?: Record<string, SyncSchemaIndexDefinition>;
};

/**
 * A description of lists and their indexes, applied with syncSchema
 */
export type SyncSchemaDocument = {
  $schema?: string;

  /**
   * The scope this document manages, e.g. the name of the app its lists
   * belong to
   */
  scope?: string;

  /**
   * Lists, keyed by path name
   */
  lists: Record<string, SyncSchemaListDefinition>;
};

export type SyncSchemaAction =
  'create' | 'update' | 'adopt' | 'no-change' | 'error';

export type SyncSchemaError = {
  name: string;
  code: number;
  message: string;
};

export type SyncSchemaChange = {
  resourceType: 'list' | 'index';

  /**
   * The list's path name
   */
  list: string;

  /**
   * The index's path name, for index changes
   */
  index?: string;
  listId?: string;
  indexId?: string;
  action: SyncSchemaAction;
  fields?: Record<string, { from: any; to: any }>;
  build?: {
    reason: 'created' | 'pointerChanged';
    items: number;
    requiresConfirmation: boolean;
    buildStatus?: IndexBuildStatus;
  };
  warnings?: string[];
  errors?: SyncSchemaError[];
};

export type SyncSchemaResult = {
  syncId: string;
  dryRun: boolean;
  applied: boolean;
  scope: string | null;
  summary: {
    create: number;
    update: number;
    adopt: number;
    noChange: number;
    error: number;
    builds: number;
  };
  changes: SyncSchemaChange[];

  /**
   * Why the sync wasn't applied (or, in a dry run, wouldn't be)
   */
  blockedBy: SyncSchemaError | null;
};

export type SyncSchemaOptions = {
  /**
   * Return the plan without changing anything
   */
  dryRun?: boolean;

  /**
   * Allow changes that rebuild an index in a list that has items, which makes
   * the index unusable until the rebuild finishes
   */
  allowRebuild?: boolean;
};

export type ExportSchemaOptions = {
  /**
   * Only lists managed by this scope
   */
  scope?: string;

  /**
   * Only lists with these tags. A string can contain comma-separated tags
   * (any of them), and an array requires a match for every element
   */
  tagged?: string | string[];

  /**
   * Only lists with these path names
   */
  lists?: string[];
};

export type SyncSchemaExport = {
  document: SyncSchemaDocument & { $schema: string };
  warnings: string[];
};
