export type TokenPermission = {
  mode: 'allow' | 'block';
  action:
    | '*'
    | 'create'
    | 'view'
    | 'update'
    | 'delete'
    | 'restore'
    | 'register'
    | 'authenticate'
    | 'reset-password'
    | 'verify-email'
    | 'create-with-identity'
    | 'view-with-identity'
    | 'update-with-identity'
    | 'delete-with-identity'
    | 'restore-with-identity'
    | 'sync-schema'
    | 'run'
    | 'run-with-identity';
  resourceType?:
    'list' | 'item' | 'index' | 'identity' | 'event' | 'stats' | 'flow';
  listIds?: string[];
  itemIds?: string[];
  indexIds?: string[];
  identityIds?: string[];
  groups?: string[];

  /**
   * For the run and run-with-identity actions: the flows the token can run
   */
  flowIds?: string[];
};
