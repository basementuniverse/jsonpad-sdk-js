# JSONPad SDK

This package allows you to connect to JSONPad and manage your lists, items, indexes, and identities without needing to use the RESTful API directly.

## Installation

Using NPM (e.g. for server-side Node.js or client-side use with a bundler like Webpack):

```bash
npm install @basementuniverse/jsonpad-sdk
```

To use the SDK in the browser, you can include it directly from a local file or CDN.

```html
<script src="https://cdn.jsdelivr.net/npm/@basementuniverse/jsonpad-sdk@1.6.1/build/jsonpad-sdk.js"></script>
```

If you'd prefer to download it and include the file manually, you only need `build/jsonpad-sdk.js` from the package.

Type definitions are included in the package for TypeScript users. These are in `/build/jsonpad-sdk.d.ts`.

See [Types](#types) for a reference of the types available in the SDK.

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
<script>

const jsonpad = new JSONPad.default('your-api-token');

</script>
```

You can also pass in an identity group and identity token if you're using identities and you want to cache an identity's credentials in the SDK instance for subsequent requests:

```ts
const jsonpad = new JSONPad(
  'your-api-token',
  'your-identity-group',
  'your-identity-token'
);
```

## Contents

### Lists

- [Create a list](#create-a-list)
- [Fetch all lists](#fetch-all-lists)
- [Fetch a list](#fetch-a-list)
- [Search a list](#search-a-list)
- [Fetch list stats](#fetch-list-stats)
- [Fetch list events](#fetch-list-events)
- [Fetch a list event](#fetch-a-list-event)
- [Update a list](#update-a-list)
- [Delete a list](#delete-a-list)

### Items

- [Create an item](#create-an-item)
- [Fetch all items](#fetch-all-items)
- [Fetch all items data](#fetch-all-items-data)
- [Fetch an item](#fetch-an-item)
- [Fetch an item's data](#fetch-an-items-data)
- [Fetch item stats](#fetch-item-stats)
- [Fetch item events](#fetch-item-events)
- [Fetch an item event](#fetch-an-item-event)
- [Update an item](#update-an-item)
- [Update an item's data](#update-an-items-data)
- [Replace an item's data](#replace-an-items-data)
- [Patch an item's data](#patch-an-items-data)
- [Delete an item](#delete-an-item)
- [Delete part of an item's data](#delete-part-of-an-items-data)

### Indexes

- [Create an index](#create-an-index)
- [Fetch all indexes](#fetch-all-indexes)
- [Fetch an index](#fetch-an-index)
- [Fetch index stats](#fetch-index-stats)
- [Fetch index events](#fetch-index-events)
- [Fetch an index event](#fetch-an-index-event)
- [Update an index](#update-an-index)
- [Delete an index](#delete-an-index)

### Identities

- [Create an identity](#create-an-identity)
- [Fetch all identities](#fetch-all-identities)
- [Fetch an identity](#fetch-an-identity)
- [Fetch identity stats](#fetch-identity-stats)
- [Fetch identity events](#fetch-identity-events)
- [Fetch an identity event](#fetch-an-identity-event)
- [Update an identity](#update-an-identity)
- [Delete an identity](#delete-an-identity)
- [Register an identity](#register-an-identity)
- [Login using an identity](#login-using-an-identity)
- [Logout from an identity](#logout-from-an-identity)
- [Fetch the currently logged in identity](#fetch-the-currently-logged-in-identity)
- [Update the currently logged in identity](#update-the-currently-logged-in-identity)
- [Delete the currently logged in identity](#delete-the-currently-logged-in-identity)

## SDK Reference

### Create a list

```ts
function createList(
  data: {
    // The list name
    name?: string;

    // A short description of the list
    description?: string;

    // A case-insensitive name which can be used to refer to the list in API paths or SDK methods
    // Must be unique, and can only contain A-Z, a-z, 0-9, - and _
    pathName?: string;

    // An optional JSON Schema for validating item data in this list
    schema?: any;

    // Should this item be pinned to the menu (for quick access) in the jsonpad.io dashboard?
    pinned?: boolean;

    // Should this list be readonly? This will prevent the list from being modified, and also prevents items and indexes in the list from being created, updated, or deleted
    // Default is false
    readonly?: boolean;

    // Should realtime events be enabled for this list and items contained in this list?
    // Default is false
    realtime?: boolean;

    // Should this list be protected? This will prevent the list from being deleted if it contains any items
    // Default is false
    protected?: boolean;

    // Should this list be indexable? This will allow users to fetch a list of items contained in this list
    // Default is true
    indexable?: boolean;

    // Should this list be generative? This will allow users to use AI to generate new items in this list
    // Default is false
    generative?: boolean;

    // A prompt to use when generating new items in this list
    generativePrompt?: string;
  }
): Promise<List>;
```

Example:

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
function fetchLists(
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of lists per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the lists by this field
    // Default is createdAt
    order?:
      | 'createdAt'
      | 'updatedAt'
      | 'name'
      | 'pathName'
      | 'pinned'
      | 'readonly'
      | 'realtime'
      | 'indexable'
      | 'generative'
      | 'protected';

    // The order direction
    // Default is desc for most date/boolean fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter lists by name (partial match, case-insensitive)
    name?: string;

    // Filter lists by path name (partial match, case-insensitive)
    pathName?: string;

    // Filter lists by pinned status
    pinned?: boolean;

    // Filter lists by readonly status
    readonly?: boolean;

    // Filter lists by realtime status
    realtime?: boolean;

    // Filter lists by indexable status
    indexable?: boolean;

    // Filter lists by protected status
    protected?: boolean;

    // Filter lists by generative status
    generative?: boolean;
  }
): Promise<PaginatedResponse<List>>;
```

Example:

```ts
const response: PaginatedResponse<List> = await jsonpad.fetchLists({
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch a list

This only returns the list (i.e. metadata like name, description etc.) and does not include the list's items or indexes.

```ts
function fetchList(
  id: string // The list id or path name
): Promise<List>;
```

Example:

```ts
const list: List = await jsonpad.fetchList('3e3ce22b-ec32-4c9d-956b-27ba00f38aa9');
```

### Search a list

```ts
function searchList(
  id: string, // The list id or path name
  query: string, // The search query
  parameters: {
    // Include items in the search results
    includeItems?: boolean;

    // Include item data in the search results
    // (only used if items are included in the results)
    includeData?: boolean;
  }
): Promise<SearchResult[]>;
```

Example:

```ts
const results: SearchResult[] = await jsonpad.searchList(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  'search query',
  {
    includeItems: true,
    includeData: true,
  }
);
```

Example result:

```ts
// With includeItems: false
[
  {
    relevance: 0.5,
    id: '463de413-df83-4a0d-8acb-b157a6afffd6'
  },
  // more results...
]

// With includeItems: true and includeData: false
[
  {
    relevance: 0.5,
    item: {
      id: '463de413-df83-4a0d-8acb-b157a6afffd6',
      createdAt: new Date('2021-01-01T00:00:00Z'),
      updatedAt: new Date('2021-01-01T00:00:00Z'),
      description: 'This is Alice',
      version: '1.0.0',
      readonly: false,
      activated: true,
      size: 123,
    }
  },
  // more results...
]

// With includeItems: true and includeData: true
[
  {
    relevance: 0.5,
    item: {
      id: '463de413-df83-4a0d-8acb-b157a6afffd6',
      createdAt: new Date('2021-01-01T00:00:00Z'),
      updatedAt: new Date('2021-01-01T00:00:00Z'),
      data: {
        name: 'Alice',
        age: 30,
      },
      description: 'This is Alice',
      version: '1.0.0',
      readonly: false,
      activated: true,
      size: 123,
    }
  },
  // more results...
]
```

### Fetch list stats

```ts
function fetchListStats(
  id: string, // The list id or path name
  parameters: {
    // The number of days to fetch stats for
    // Default is 7, max is 90
    days?: number;
  }
): Promise<ListStats>;
```

Example:

```ts
const stats: ListStats = await jsonpad.fetchListStats(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    days: 7,
  }
);
```

### Fetch list events

```ts
function fetchListEvents(
  id: string, // The list id or path name
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of events per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the events by this field
    // Default is createdAt
    order?:
      | 'createdAt'
      | 'type';

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter events by type
    type?:
      | 'list-created'
      | 'list-updated'
      | 'list-deleted';

    // Filter for events after this date
    startAt?: Date;

    // Filter for events before this date
    endAt?: Date;
  }
): Promise<PaginatedResponse<Event>>;
```

Example:

```ts
const response: PaginatedResponse<Event> = await jsonpad.fetchListEvents(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
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
function fetchListEvent(
  id: string, // The list id or path name
  eventId: string // The event id
): Promise<Event>;
```

Example:

```ts
const event: Event = await jsonpad.fetchListEvent(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  'b87aacfb-15b3-43d3-8ffc-a21443ee05f2'
);
```

### Update a list

```ts
function updateList(
  id: string, // The list id or path name
  data: {
    // The list name
    name?: string;

    // A short description of the list
    description?: string;

    // A case-insensitive name which can be used to refer to the list in API paths or SDK methods
    // Must be unique, and can only contain A-Z, a-z, 0-9, - and _
    pathName?: string;

    // An optional JSON Schema for validating item data in this list
    schema?: any;

    // Should this item be pinned to the menu (for quick access) in the jsonpad.io dashboard?
    pinned?: boolean;

    // Should this list be readonly? This will prevent the list from being modified, and also prevents items and indexes in the list from being created, updated, or deleted
    // Default is false
    readonly?: boolean;

    // Should realtime events be enabled for this list and items contained in this list?
    // Default is false
    realtime?: boolean;

    // Should this list be protected? This will prevent the list from being deleted if it contains any items
    // Default is false
    protected?: boolean;

    // Should this list be indexable? This will allow users to fetch a list of items contained in this list
    // Default is true
    indexable?: boolean;

    // Should this list be generative? This will allow users to use AI to generate new items in this list
    // Default is false
    generative?: boolean;

    // A prompt to use when generating new items in this list
    generativePrompt?: string;
  }
): Promise<List>;
```

Example:

```ts
const list: List = await jsonpad.updateList(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    name: 'My Updated List',
    description: 'This is my updated list',
  }
);
```

### Delete a list

```ts
function deleteList(
  id: string // The list id or path name
): Promise<void>;
```

Example:

```ts
await jsonpad.deleteList('3e3ce22b-ec32-4c9d-956b-27ba00f38aa9');
```

### Create an item

```ts
function createItem(
  listId: string, // The list id or path name
  data: {
    // The item data
    data: any;

    // A short description of the item
    description?: string;

    // Manually set the item's version
    // Default is "1"
    version?: string;

    // Should this item be readonly?
    readonly?: boolean;
  },
  parameters?: {
    // Should a new item id be generated?
    // Default is true
    generate?: boolean;

    // Include the item data in the response?
    // Default is true
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Item>;
```

Example:

```ts
const item: Item = await jsonpad.createItem(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    data: {
      name: 'Alice',
      age: 30,
    },
    description: 'This is Alice',
  },
  {
    generate: false,
    includeData: true,
  }
);
```

If you have previously logged in using an identity, the identity group and identity token will have been cached in the SDK instance and will be included in subsequent requests by default.

You can override these cached credentials by passing different credentials into the `identity` parameter.

Or, you can skip using identity credentials altogether by setting `ignore: true` in the `identity` parameter.

### Fetch all items

```ts
function fetchItems(
  listId: string, // The list id or path name
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of items per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the items by this field
    // Default is createdAt
    order?: ItemOrderBy;

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?: OrderDirection;

    // Filter items by alias (partial match, case-insensitive)
    // This uses an alias index, if the list has one
    alias?: string;

    // Filter items by readonly status
    readonly?: boolean;

    // Should we include the item data for each item in the response?
    // Defualt is false
    includeData?: boolean;

    // Optionally only include a part of each item's data in the response
    // This uses JSON Path syntax
    path?: string;

    // Filter items by an indexed field
    // This should match the path name of an index in the list
    [key: string]: any;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<PaginatedResponse<Item>>;
```

Example:

```ts
const response: PaginatedResponse<Item> = await jsonpad.fetchItems(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
  }
);
```

### Fetch all items data

```ts
function fetchItemsData<T = any>(
  listId: string, // The list id or path name
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of items per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the items by this field
    // Default is createdAt
    order?: ItemOrderBy;

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?: OrderDirection;

    // Filter items by alias (partial match, case-insensitive)
    // This uses an alias index, if the list has one
    alias?: string;

    // Filter items by readonly status
    readonly?: boolean;

    // Optionally only include a part of each item's data in the response
    // This uses JSON Path syntax
    path?: string;

    // Optionally only include a specific field from each item's data in the response
    // If both a pointer and a path are provided, the path will start at the pointer location (i.e. the pointer will be evaluated first, then the path will be evaluated on the result)
    // This uses JSON Pointer syntax
    pointer?: string;

    // Filter items by an indexed field
    // This should match the path name of an index in the list
    [key: string]: any;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<PaginatedResponse<T>>;
```

Example:

```ts
const response: PaginatedResponse<any> = await jsonpad.fetchItemsData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
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
function fetchItem(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  parameters?: {
    // Fetch a specific version of an item
    // If not provided, the latest version will be fetched
    version?: string;

    // Should we include the item data in the response?
    // Default is false
    includeData?: boolean;

    // Optionally only include a part of the item's data in the response
    // This uses JSON Path syntax
    path?: string;

    // If the item doesn't exist, should we use AI and the list prompt to generate a new item?
    // If the list is generative, this will default to true
    // This parameter can be used to override the list's generative setting
    generate?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Item>;
```

Example:

```ts
const item: Item = await jsonpad.fetchItem(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b'
);
```

### Fetch an item's data

```ts
function fetchItemData(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  parameters?: {
    // Fetch a specific version of an item
    // If not provided, the latest version will be fetched
    version?: string;

    // Optionally only include a part of the item's data in the response
    // This uses JSON Path syntax
    path?: string;

    // Optionally only include a specific field from the item's data in the response
    // If both a pointer and a path are provided, the path will start at the pointer location (i.e. the pointer will be evaluated first, then the path will be evaluated on the result)
    // This uses JSON Pointer syntax
    pointer?: string;

    // If the item doesn't exist, should we use AI and the list prompt to generate a new item?
    // If the list is generative, this will default to true
    // This parameter can be used to override the list's generative setting
    generate?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Item>;
```

Example:

```ts
const itemData: any = await jsonpad.fetchItemData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b'
);
```

### Fetch item stats

```ts
function fetchItemStats(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  parameters: {
    // The number of days to fetch stats for
    // Default is 7, max is 90
    days?: number;
  }
): Promise<ItemStats>;
```

Example:

```ts
const stats: ItemStats = await jsonpad.fetchItemStats(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
  {
    days: 7,
  }
);
```

### Fetch item events

```ts
function fetchItemEvents(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of events per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the events by this field
    // Default is createdAt
    order?:
      | 'createdAt'
      | 'type';

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter events by type
    type?:
      | 'item-created'
      | 'item-updated'
      | 'item-deleted';

    // Filter for events after this date
    startAt?: Date;

    // Filter for events before this date
    endAt?: Date;
  }
): Promise<PaginatedResponse<Event>>;
```

Example:

```ts
const response: PaginatedResponse<Event> = await jsonpad.fetchItemEvents(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
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
function fetchItemEvent(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  eventId: string // The event id
): Promise<Event>;
```

Example:

```ts
const event: Event = await jsonpad.fetchItemEvent(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
  'b87aacfb-15b3-43d3-8ffc-a21443ee05f2'
);
```

### Update an item

```ts
function updateItem(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  data: {
    // The item data
    data: any;

    // A short description of the item
    description?: string;

    // Manually set the item's version
    // By default this will increment the current version number
    version?: string;

    // Should this item be readonly?
    readonly?: boolean;
  },
  parameters?: {
    // Should we include the item data in the response?
    // Default is false
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Item>;
```

Example:

```ts
const item: Item = await jsonpad.updateItem(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
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
function updateItemData(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  data: any, // The new item data
  parameters?: {
    // Optionally update an item's data at a specific location
    // This uses JSON Pointer syntax
    pointer?: string;

    // Should we include the item data in the response?
    // Default is true
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<any>;
```

Example:

```ts
const itemData: any = await jsonpad.updateItemData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
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
function replaceItemData(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  data: any, // The new item data
  parameters?: {
    // Optionally replace an item's data at a specific location
    // This uses JSON Pointer syntax
    pointer?: string;

    // Should we include the item data in the response?
    // Default is true
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<any>;
```

Example:

```ts
const itemData: any = await jsonpad.replaceItemData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
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
function patchItemData(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  patch: JSONPatch, // The JSON Patch operations to apply
  parameters?: {
    // Optionally patch an item's data at a specific location
    // This uses JSON Pointer syntax
    pointer?: string;

    // Should we include the item data in the response?
    // Default is true
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<any>;
```

Example:

```ts
const itemData: any = await jsonpad.patchItemData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
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
function deleteItem(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<void>;
```

Example:

```ts
await jsonpad.deleteItem(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b'
);
```

### Delete part of an item's data

```ts
function deleteItemData(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias
  parameters: {
    // Optionally delete part of an item's data at a specific location
    // This uses JSON Pointer syntax
    pointer?: string;

    // Should we include the item data in the response?
    // Default is true
    includeData?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Item>;
```

Example:

```ts
const itemData: any = await jsonpad.deleteItemData(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '098e58bc-05f6-4a59-a755-fb9bc54f4a5b',
  {
    pointer: '<JSON Pointer>',
  }
);
```

### Create an index

```ts
function createIndex(
  listId: string, // The list id or path name
  data: {
    // The index name
    name: string;

    // A short description of the index
    description?: string;

    // The path name of index, used in API paths and SDK methods
    pathName: string;

    // The value type of the field to index
    valueType:
      | 'string'
      | 'number'
      | 'date';

    // Should this index be an alias index?
    // Alias indexes are used to quickly fetch items by alias
    // Default is false
    alias?: boolean;

    // Should this index be used for sorting?
    // Default is false
    sorting?: boolean;

    // Should this index be used for filtering?
    // Default is false
    filtering?: boolean;

    // Should this index be used for searching?
    // Default is false
    searching?: boolean;

    // The default order direction for this index
    // Default is asc
    defaultOrderDirection?:
      | 'asc'
      | 'desc';
  }
): Promise<Index>;
```

Example:

```ts
const index: Index = await jsonpad.createIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    name: 'Name',
    description: 'Name index',
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

### Fetch all indexes

```ts
function fetchIndexes(
  listId: string, // The list id or path name
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of indexes per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the indexes by this field
    // Default is createdAt
    order?:
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

    // The order direction
    // Default is desc for most date/boolean fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter indexes by name (partial match, case-insensitive)
    name?: string;

    // Filter indexes by path name (partial match, case-insensitive)
    pathName?: string;

    // Filter indexes by value type
    valueType?:
      | 'string'
      | 'number'
      | 'date';

    // Filter indexes by alias status
    alias?: boolean;

    // Filter indexes by default order direction
    defaultOrderDirection?:
      | 'asc'
      | 'desc';
  }
): Promise<PaginatedResponse<Index>>;
```

Example:

```ts
const response: PaginatedResponse<Index> = await jsonpad.fetchIndexes(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  {
    page: 1,
    limit: 10,
    order: 'createdAt',
    direction: 'desc',
  }
);
```

### Fetch an index

```ts
function fetchIndex(
  listId: string, // The list id or path name
  indexId: string // The index id or path name
): Promise<Index>;
```

Example:

```ts
const index: Index = await jsonpad.fetchIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6'
);
```

### Fetch index stats

```ts
function fetchIndexStats(
  listId: string, // The list id or path name
  indexId: string, // The index id or path name
  parameters: {
    // The number of days to fetch stats for
    // Default is 7, max is 90
    days?: number;
  }
): Promise<IndexStats>;
```

Example:

```ts
const stats: IndexStats = await jsonpad.fetchIndexStats(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6',
  {
    days: 7,
  }
);
```

### Fetch index events

```ts
function fetchIndexEvents(
  listId: string, // The list id or path name
  indexId: string, // The index id or path name
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of events per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the events by this field
    // Default is createdAt
    order?:
      | 'createdAt'
      | 'type';

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter events by type
    type?:
      | 'index-created'
      | 'index-updated'
      | 'index-deleted';

    // Filter for events after this date
    startAt?: Date;

    // Filter for events before this date
    endAt?: Date;
  }
): Promise<PaginatedResponse<Event>>;
```

Example:

```ts
const response: PaginatedResponse<Event> = await jsonpad.fetchIndexEvents(
  'list-id3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6',
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
function fetchIndexEvent(
  listId: string, // The list id or path name
  indexId: string, // The index id or path name
  eventId: string // The event id
): Promise<Event>;
```

Example:

```ts
const event: Event = await jsonpad.fetchIndexEvent(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6',
  'b87aacfb-15b3-43d3-8ffc-a21443ee05f2'
);
```

### Update an index

```ts
function updateIndex(
  listId: string, // The list id or path name
  indexId: string, // The index id or path name
  data: {
    // The index name
    name?: string;

    // A short description of the index
    description?: string;

    // The path name of index, used in API paths and SDK methods
    pathName?: string;

    // The value type of the field to index
    valueType?:
      | 'string'
      | 'number'
      | 'date';

    // Should this index be an alias index?
    // Alias indexes are used to quickly fetch items by alias
    alias?: boolean;

    // Should this index be used for sorting?
    sorting?: boolean;

    // Should this index be used for filtering?
    filtering?: boolean;

    // Should this index be used for searching?
    searching?: boolean;

    // The default order direction for this index
    defaultOrderDirection?:
      | 'asc'
      | 'desc';
  }
): Promise<Index>;
```

Example:

```ts
const index: Index = await jsonpad.updateIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6',
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
function deleteIndex(
  listId: string, // The list id or path name
  indexId: string // The index id or path name
): Promise<void>;
```

Example:

```ts
await jsonpad.deleteIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6'
);
```

### Create an identity

```ts
function createIdentity(
  data: {
    // The identity name
    name: string;

    // The identity group
    group?: string;

    // The identity password
    password: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.createIdentity({
  name: 'Alice',
  group: 'my-group',
  password: 'secret',
});
```

### Fetch all identities

```ts
function fetchIdentities(
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of identities per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the identities by this field
    // Default is createdAt
    order?: IdentityOrderBy;

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?: OrderDirection;

    // Filter identities by group (partial match, case-insensitive)
    group?: string;

    // Filter identities by name (partial match, case-insensitive)
    name?: string;
  }
): Promise<PaginatedResponse<Identity>>;
```

Example:

```ts
const response: PaginatedResponse<Identity> = await jsonpad.fetchIdentities({
  page: 1,
  limit: 10,
  order: 'createdAt',
  direction: 'desc',
});
```

### Fetch an identity

```ts
function fetchIdentity(
  identityId: string // The identity id
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.fetchIdentity(
  '59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0'
);
```

### Fetch identity stats

```ts
function fetchIdentityStats(
  identityId: string, // The identity id
  parameters: {
    // The number of days to fetch stats for
    // Default is 7, max is 90
    days?: number;
  }
): Promise<IdentityStats>;
```

Example:

```ts
const stats: IdentityStats = await jsonpad.fetchIdentityStats(
  '59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0',
  {
    days: 7,
  }
);
```

### Fetch identity events

```ts
function fetchIdentityEvents(
  identityId: string, // The identity id
  parameters: {
    // The page number to fetch
    // Default is 1
    page?: number;

    // The number of events per page
    // Default is 20, maximum is 100
    limit?: number;

    // Sort the events by this field
    // Default is createdAt
    order?:
      | 'createdAt'
      | 'type';

    // The order direction
    // Default is desc for most date fields, asc otherwise
    direction?:
      | 'asc'
      | 'desc';

    // Filter events by type
    type?:
      | 'identity-created'
      | 'identity-updated'
      | 'identity-deleted';

    // Filter for events after this date
    startAt?: Date;

    // Filter for events before this date
    endAt?: Date;
  }
): Promise<PaginatedResponse<Event>>;
```

Example:

```ts
const response: PaginatedResponse<Event> = await jsonpad.fetchIdentityEvents(
  '59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0',
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
function fetchIdentityEvent(
  identityId: string, // The identity id
  eventId: string // The event id
): Promise<Event>;
```

Example:

```ts
const event: Event = await jsonpad.fetchIdentityEvent(
  '59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0',
  'b87aacfb-15b3-43d3-8ffc-a21443ee05f2'
);
```

### Update an identity

```ts
function updateIdentity(
  identityId: string, // The identity id
  data: {
    // The identity name
    name?: string;

    // The identity group
    group?: string;

    // The identity password
    password?: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.updateIdentity(
  '59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0',
  {
    name: 'Updated Alice',
    password: 'secret',
  }
);
```

### Delete an identity

```ts
function deleteIdentity(
  identityId: string // The identity id
): Promise<void>;
```

Example:

```ts
await jsonpad.deleteIdentity('59b9f5be-06ec-4e5d-8b4c-ab48b0e9bdc0');
```

### Register an identity

```ts
function registerIdentity(
  data: {
    // The identity group
    group?: string;

    // The identity name
    name: string;

    // The identity password
    password: string;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.registerIdentity({
  group: 'my-group',
  name: 'Alice',
  password: 'secret',
});
```

### Login using an identity

```ts
function loginIdentity(
  data: {
    // The identity group
    group?: string;

    // The identity name
    name: string;

    // The identity password
    password: string;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<[Identity, string]>;
```

Example:

```ts
let identity: Identity;
let token: string;

[identity, token] = await jsonpad.loginIdentity({
  group: 'my-group',
  name: 'Alice',
  password: 'secret',
});
```

The identity group and token will be cached in the SDK instance and used for subsequent requests.

### Logout from an identity

```ts
function logoutIdentity(
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<void>;
```

Example:

```ts
await jsonpad.logoutIdentity();
```

### Fetch the currently logged in identity

```ts
function fetchSelfIdentity(
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.fetchSelfIdentity();
```

### Update the currently logged in identity

```ts
function updateSelfIdentity(
  data: {
    // The identity name
    name?: string;

    // The identity password
    password?: string;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.updateSelfIdentity({
  name: 'Updated Alice',
  password: 'secret',
});
```

### Delete the currently logged in identity

```ts
function deleteSelfIdentity(
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
): Promise<void>;
```

Example:

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
  PaginatedResponse,
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
    // The total number of items in this list
    total: number;

    // The total number of items created in this list during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of items created on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by list id; this is just here for future-proofing (the ability to fetch multi-list stats might be added in the future)
      // Right now this will only contain the id of the list being fetched
      lists: {
        [id: string]: number;
      };
    }[];
  };
  indexes: {
    // The total number of indexes in this list
    total: number;

    // The total number of indexes created in this list during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of indexes created on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by list id; this is just here for future-proofing (the ability to fetch multi-list stats might be added in the future)
      lists: {
        [id: string]: number;
      };
    }[];
  };
  events: {
    // The total number of events for this list
    total: number;

    // The total number of events for this list during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of events for this list on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by event type for this day
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
    // The total number of events for this item
    total: number;

    // The total number of events for this item during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of events for this item on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by event type for this day
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
    // The total number of events for this index
    total: number;

    // The total number of events for this index during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of events for this index on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by event type for this day
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
    // The total number of events for this identity
    total: number;

    // The total number of events for this identity during the specified period
    totalThisPeriod: number;

    // A list of objects, where each object represents a day and the number of events for this identity on that day
    metrics: {
      date: Date;
      count: number;

      // Metrics broken down by event type for this day
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

### `PaginatedResponse`

```ts
type PaginatedResponse<T = any> = {
  page: number;
  limit: number;
  total: number;
  data: T[];
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
