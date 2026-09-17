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
    | 'sync-schema';
  resourceType?: 'list' | 'item' | 'index' | 'identity' | 'event' | 'stats';
  listIds?: string[];
  itemIds?: string[];
  indexIds?: string[];
  identityIds?: string[];
  groups?: string[];
};
