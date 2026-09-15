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
  'create' | 'update' | 'adopt' | 'delete' | 'no-change' | 'error';

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

  /**
   * For a resource a prune deletes
   */
  delete?: {
    /**
     * How many items are deleted with a list
     */
    items?: number;

    /**
     * How many indexes are deleted with a list
     */
    indexes?: number;

    /**
     * Whether the delete needs allowDestructive: a list that has items, or a
     * guard index
     */
    destructive: boolean;
  };
  warnings?: string[];
  errors?: SyncSchemaError[];
};

export type SyncSchemaResult = {
  syncId: string;
  dryRun: boolean;
  applied: boolean;
  prune: boolean;
  scope: string | null;
  summary: {
    create: number;
    update: number;
    adopt: number;
    delete: number;
    noChange: number;
    error: number;
    builds: number;
    destructive: number;
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

  /**
   * Also delete the lists and indexes the document's scope manages that it no
   * longer declares. Needs a scope
   */
  prune?: boolean;

  /**
   * Allow a prune to delete lists that have items, and guard indexes
   */
  allowDestructive?: boolean;
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

/**
 * The lists to move: either lists by id or path name, or every list a scope
 * manages
 */
export type MoveListsSelection = { lists: string[] } | { fromScope: string };

export type MoveListsOptions = {
  /**
   * Return the plan without changing anything
   */
  dryRun?: boolean;
};

export type MoveListsAction =
  'move' | 'assign' | 'release' | 'no-change' | 'error';

export type MoveListsChange = {
  /**
   * The list's path name (or id, if it has none), or the requested list if it
   * wasn't found
   */
  list: string;
  listId?: string;
  action: MoveListsAction;
  from?: string | null;
  to?: string | null;

  /**
   * How many of the list's indexes the scope manages, which move (or are
   * released) with the list
   */
  indexes?: number;
  fields?: Record<string, { from: any; to: any }>;
  warnings?: string[];
  errors?: SyncSchemaError[];
};

export type MoveListsResult = {
  moveId: string;
  dryRun: boolean;
  applied: boolean;

  /**
   * The scope the lists were moved to, or null if they were released
   */
  scope: string | null;
  summary: {
    move: number;
    assign: number;
    release: number;
    noChange: number;
    error: number;
  };
  changes: MoveListsChange[];
  warnings: string[];

  /**
   * Why the move wasn't applied (or, in a dry run, wouldn't be)
   */
  blockedBy: SyncSchemaError | null;
};
