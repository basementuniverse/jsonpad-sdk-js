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

## Types

The SDK includes TypeScript types for the JSONPad API. You can import them like so:

```ts
import JSONPad, {
  List,
  Item,
  Index,
  Event,
  User,
  EventOrderBy,
  EventStream,
  IndexEventType,
  IndexOrderBy,
  IndexStats,
  IndexValueType,
  ItemEventType,
  ItemOrderBy,
  ItemStats,
  ListEventType,
  ListOrderBy,
  ListStats,
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
  activated: boolean;
  itemCount: number;
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
