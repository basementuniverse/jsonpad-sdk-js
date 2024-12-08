# JSONPad SDK

This package allows you to connect to JSONPad and manage your lists, items and indexes without needing to use the RESTful API directly.

## Installation

```bash
npm install @basementuniverse/jsonpad-sdk
```

## Usage

Create an instance of the JSONPad SDK and pass in your API token:

Node (JS):

```js
const JSONPad = require('@basementuniverse/jsonpad-sdk').default;

const jsonpad = new JSONPad('your-api-token');
```

Node (TS):

```ts
import JSONPad from '@basementuniverse/jsonpad-sdk';

const jsonpad = new JSONPad('your-api-token');
```

Browser:

```html
<script src="https://cdn.jsdelivr.net/npm/@basementuniverse/jsonpad-sdk@1.0.0/build/jsonpad-sdk.js"></script>
<script>

const jsonpad = new JSONPad.default('your-api-token');

</script>
```

You can also pass in an identity group and token if you want to authenticate as a specific identity:

_(Note that the identity group and token will also be automatically populated when you log in as an identity)_

```ts
const jsonpad = new JSONPad(
  'your-api-token',
  'your-identity-group',
  'your-identity-token'
);
```

### Create a list

```ts
const list: List = await jsonpad.createList({
  name: 'My List',
  description: 'This is my list',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      age: { type: 'number' },
    },
    required: ['name', 'age'],
  },
});
```

### Fetch all lists

```ts
const lists: List[] = await jsonpad.fetchLists({
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch a list

```ts
const list: List = await jsonpad.fetchList('list-id');
```

### Search a list

```ts
const results: SearchResult[] = await jsonpad.searchList(
  'list-id',
  'search query',
  {
    includeItems: true,
    includeData: true,
  }
);
```

### Fetch list stats

```ts
const stats: ListStats = await jsonpad.fetchListStats(
  'list-id',
  {
    days: 7,
  }
);
```

### Fetch list events

```ts
const events: Event[] = await jsonpad.fetchListEvents(
  'list-id',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
    startAt: new Date('2021-01-01'),
    endAt: new Date('2021-12-31'),
  }
);
```

### Fetch a list event

```ts
const event: Event = await jsonpad.fetchListEvent(
  'list-id',
  'event-id'
);
```

### Update a list

```ts
const list: List = await jsonpad.updateList('list-id', {
  name: 'My Updated List',
  description: 'This is my updated list',
});
```

### Delete a list

```ts
await jsonpad.deleteList('list-id');
```

### Create an item

```ts
const item: Item = await jsonpad.createItem('list-id', {
  data: {
    name: 'Alice',
    age: 30,
  },
  description: 'This is Alice',
});
```

### Fetch all items

```ts
const items: Item[] = await jsonpad.fetchItems('list-id', {
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch all items data

```ts
const itemsData: any[] = await jsonpad.fetchItemsData(
  'list-id',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
  }
);
```

### Fetch an item

```ts
const item: Item = await jsonpad.fetchItem(
  'list-id',
  'item-id'
);
```

### Fetch an item's data

```ts
const itemData: any = await jsonpad.fetchItemData(
  'list-id',
  'item-id'
);
```

### Fetch part of an item's data

```ts
const itemData: any = await jsonpad.fetchItemData(
  'list-id',
  'item-id',
  {
    path: '<JSON Path>',
    pointer: '<JSON Pointer>',
  }
);
```

### Fetch item stats

```ts
const stats: ItemStats = await jsonpad.fetchItemStats(
  'list-id',
  'item-id',
  {
    days: 7,
  }
);
```

### Fetch item events

```ts
const events: Event[] = await jsonpad.fetchItemEvents(
  'list-id',
  'item-id',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
    startAt: new Date('2021-01-01'),
    endAt: new Date('2021-12-31'),
  }
);
```

### Fetch an item event

```ts
const event: Event = await jsonpad.fetchItemEvent(
  'list-id',
  'item-id',
  'event-id'
);
```

### Update an item

```ts
const item: Item = await jsonpad.updateItem(
  'list-id',
  'item-id',
  {
    data: {
      name: 'Alice',
      age: 31,
    },
    description: 'This is Alice',
  }
);
```

### Update an item's data

```ts
const itemData: any = await jsonpad.updateItemData(
  'list-id',
  'item-id',
  {
    name: 'Alice',
    age: 31,
  },
  {
    pointer: '<JSON Pointer>',
  }
);
```

### Replace an item's data

```ts
const itemData: any = await jsonpad.replaceItemData(
  'list-id',
  'item-id',
  {
    name: 'Alice',
    age: 31,
  },
  {
    pointer: '<JSON Pointer>',
  }
);
```

### Patch an item's data

```ts
const itemData: any = await jsonpad.patchItemData(
  'list-id',
  'item-id',
  [
    { op: 'add', path: '/name', value: 'Alice' },
    { op: 'add', path: '/age', value: 31 },
  ],
  {
    pointer: '<JSON Pointer>',
  }
);
```

### Delete an item

```ts
await jsonpad.deleteItem('list-id', 'item-id');
```

### Delete part of an item's data

```ts
const itemData: any = await jsonpad.deleteItemData(
  'list-id',
  'item-id',
  {
    pointer: '<JSON Pointer>',
  }
);
```

### Create an index

```ts
const index: Index = await jsonpad.createIndex('list-id', {
  name: 'Name',
  description: 'Name index',
  pathName: 'name',
  valueType: 'string',
  alias: false,
  sorting: true,
  filtering: true,
  searching: true,
  defaultOrderDirection: 'asc',
});
```

### Fetch all indexes

```ts
const indexes: Index[] = await jsonpad.fetchIndexes('list-id', {
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch an index

```ts
const index: Index = await jsonpad.fetchIndex(
  'list-id',
  'index-id'
);
```

### Fetch index stats

```ts
const stats: IndexStats = await jsonpad.fetchIndexStats(
  'list-id',
  'index-id',
  {
    days: 7,
  }
);
```

### Fetch index events

```ts
const events: Event[] = await jsonpad.fetchIndexEvents(
  'list-id',
  'index-id',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
    startAt: new Date('2021-01-01'),
    endAt: new Date('2021-12-31'),
  }
);
```

### Fetch an index event

```ts
const event: Event = await jsonpad.fetchIndexEvent(
  'list-id',
  'index-id',
  'event-id'
);
```

### Update an index

```ts
const index: Index = await jsonpad.updateIndex(
  'list-id',
  'index-id',
  {
    name: 'Updated Name',
    description: 'Updated name index',
    pathName: 'name',
    valueType: 'string',
    alias: false,
    sorting: true,
    filtering: true,
    searching: true,
    defaultOrderDirection: 'asc',
  }
);
```

### Delete an index

```ts
await jsonpad.deleteIndex('list-id', 'index-id');
```

### Create an identity

```ts
const identity: Identity = await jsonpad.createIdentity({
  name: 'Alice',
  group: 'my-group',
  password: 'secret',
});
```

### Fetch all identities

```ts
const identities: Identity[] = await jsonpad.fetchIdentities({
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch an identity

```ts
const identity: Identity = await jsonpad.fetchIdentity('identity-id');
```

### Fetch identity stats

```ts
const stats: IdentityStats = await jsonpad.fetchIdentityStats(
  'identity-id',
  {
    days: 7,
  }
);
```

### Fetch identity events

```ts
const events: Event[] = await jsonpad.fetchIdentityEvents(
  'identity-id',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
    startAt: new Date('2021-01-01'),
    endAt: new Date('2021-12-31'),
  }
);
```

### Fetch an identity event

```ts
const event: Event = await jsonpad.fetchIdentityEvent(
  'identity-id',
  'event-id'
);
```

### Update an identity

```ts
const identity: Identity = await jsonpad.updateIdentity(
  'identity-id',
  {
    name: 'Updated Alice',
    password: 'secret',
  }
);
```

### Delete an identity

```ts
await jsonpad.deleteIdentity('identity-id');
```

### Register an identity

```ts
const identity: Identity = await jsonpad.registerIdentity({
  name: 'Alice',
  group: 'my-group',
  password: 'secret',
});
```

### Login using an identity

```ts
let identity: Identity;
let token: string;

[identity, token] = await jsonpad.loginIdentity({
  name: 'Alice',
  password: 'secret',
});
```

### Logout from an identity

```ts
await jsonpad.logoutIdentity();
```

### Fetch the currently logged in identity

```ts
const identity: Identity = await jsonpad.fetchSelfIdentity();
```

### Update the currently logged in identity

```ts
const identity: Identity = await jsonpad.updateSelfIdentity({
  name: 'Updated Alice',
  password: 'secret',
});
```

### Delete the currently logged in identity

```ts
await jsonpad.deleteSelfIdentity();
```

## Types

The SDK includes TypeScript types for the JSONPad API. You can import them like so:

```ts
import JSONPad, {
  List,
  ListEventType,
  ListOrderBy,
  ListStats,
  Item,
  ItemEventType,
  ItemOrderBy,
  ItemStats,
  Index,
  IndexEventType,
  IndexOrderBy,
  IndexStats,
  IndexValueType,
  Identity,
  IdentityEventType,
  IdentityOrderBy,
  IdentityStats,
  IdentityParameter,
  Event,
  EventOrderBy,
  EventStream,
  User,
  OrderDirection,
  PaginatedRequest,
  SearchResult,
} from '@basementuniverse/jsonpad-sdk';
```

### `List`

```ts
type List = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  name: string;
  description: string;
  pathName: string;
  schema: any;
  pinned: boolean;
  readonly: boolean;
  realtime: boolean;
  protected: boolean;
  indexable: boolean;
  generative: boolean;
  generativePrompt: string;
  activated: boolean;
  itemCount: number;
};
```

### `ListEventType`

```ts
type ListEventType =
  | 'list-created'
  | 'list-updated'
  | 'list-deleted';
```

### `ListOrderBy`

```ts
type ListOrderBy =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'pathName'
  | 'pinned'
  | 'readonly'
  | 'realtime'
  | 'indexable'
  | 'protected'
  | 'activated';
```

### `ListStats`

```ts
type ListStats = {
  maxItems: number;
  maxIndexes: number;
  items: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      lists: {
        [id: string]: number;
      };
    }[];
  };
  indexes: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      lists: {
        [id: string]: number;
      };
    }[];
  };
  events: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      types: {
        [type in ListEventType]: number;
      };
    }[];
  };
};
```

### `Item`

```ts
type Item = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  data: any;
  description: string;
  version: string;
  readonly: boolean;
  activated: boolean;
  size: number;
};
```

### `ItemEventType`

```ts
type ItemEventType =
  | 'item-created'
  | 'item-updated'
  | 'item-restored'
  | 'item-deleted';
```

### `ItemOrderBy`

```ts
type ItemOrderBy = string | 'createdAt' | 'updatedAt';
```

### `ItemStats`

```ts
type ItemStats = {
  events: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      types: {
        [type in ItemEventType]: number;
      };
    }[];
  };
}
```

### `Index`

```ts
type Index = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  pathName: string;
  pointer: string;
  valueType: IndexValueType;
  alias: boolean;
  sorting: boolean;
  filtering: boolean;
  searching: boolean;
  defaultOrderDirection: OrderDirection;
  activated: boolean;
};
```

### `IndexEventType`

```ts
type IndexEventType =
  | 'index-created'
  | 'index-updated'
  | 'index-deleted';
```

### `IndexOrderBy`

```ts
type IndexOrderBy =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'pathName'
  | 'valueType'
  | 'alias'
  | 'sorting'
  | 'filtering'
  | 'searching'
  | 'defaultOrderDirection'
  | 'activated';
```

### `IndexStats`

```ts
type IndexStats = {
  events: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      types: {
        [type in IndexEventType]: number;
      };
    }[];
  };
}
```

### `IndexValueType`

```ts
type IndexValueType = 'string' | 'number' | 'date';
```

### `Identity`

```ts
type Identity = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  name: string;
  group: string;
  lastLoginAt: Date | null;
  activated: boolean;
};
```

### `IdentityEventType`

```ts
export type IdentityEventType =
  | 'identity-created'
  | 'identity-updated'
  | 'identity-deleted'
  | 'identity-registered'
  | 'identity-logged-in'
  | 'identity-logged-out'
  | 'identity-updated-self'
  | 'identity-deleted-self';
```

### `IdentityOrderBy`

```ts
export type IdentityOrderBy =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'group'
  | 'activated';
```

### `IdentityStats`

```ts
type IdentityStats = {
  events: {
    total: number;
    totalThisPeriod: number;
    metrics: {
      date: Date;
      count: number;
      types: {
        [type in IdentityEventType]: number;
      };
    }[];
  };
}
```

### `IdentityParameter`

```ts
type IdentityParameter = {
  ignore?: boolean;
  group?: string;
  token?: string;
};
```

### `Event`

```ts
type Event = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  modelId: string;
  stream: EventStream;
  type: ListEventType | ItemEventType | IndexEventType;
  version: string;
  snapshot: any;
  attachments: any;
};
```

### `EventOrderBy`

```ts
type EventOrderBy =
  | 'createdAt'
  | 'type';
```

### `EventStream`

```ts
type EventStream = 'list' | 'item' | 'index';
```

### `User`

```ts
type User = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date | null;
  activated: boolean;
  displayName: string;
  description: string;
};
```

### `OrderDirection`

```ts
type OrderDirection = 'asc' | 'desc';
```

### `PaginatedRequest`

```ts
type PaginatedRequest<T extends string> = {
  page: number;
  limit: number;
  order: T;
  direction: OrderDirection;
};
```

### `SearchResult`

```ts
type SearchResult = (
  {
    relevance: number;
    id: string;
  } | {
    relevance: number;
    item: Item;
  }
);
```
