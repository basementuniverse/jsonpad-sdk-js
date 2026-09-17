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

A fourth argument sets options. `apiUrl` points the SDK at a different API, e.g. a
local development server:

```ts
const jsonpad = new JSONPad('your-api-token', undefined, undefined, {
  apiUrl: 'http://localhost:8000',
});
```

## Rate limits and quotas

Every response from the API includes information about your per-minute rate limit and your monthly quota. The SDK dispatches a `response` event with this information every time it receives a response, whether or not the request succeeded:

```ts
jsonpad.addEventListener('response', e => {
  const { rateLimit, quota } = e.detail;

  if (rateLimit && rateLimit.remaining < 5) {
    console.log('Nearly at the rate limit, slowing down...');
  }

  if (quota?.degraded) {
    console.log(`Out of quota until ${quota.resetAt}, writes will be refused`);
  }
});
```

The information from the most recent response is also available as `jsonpad.lastResponse`, which is `null` until the first request has been made. If you make requests concurrently, this is whichever response arrived last.

See [`ResponseMeta`](#responsemeta) for everything that's included, and [Limits and quotas](https://jsonpad.io/docs/limits-and-quotas) for how the limits work.

When a request fails, the SDK throws a [`JSONPadError`](#jsonpaderror), which includes the HTTP status, the jsonpad error code, and the same rate limit and quota information:

```ts
import JSONPad, { JSONPadError } from '@basementuniverse/jsonpad-sdk';

try {
  await jsonpad.createItem('my-list', { data: { name: 'Alice' } });
} catch (error) {
  if (error instanceof JSONPadError && error.retryAfter !== null) {
    // Wait for as long as the API asked before trying again
    await new Promise(resolve => setTimeout(resolve, error.retryAfter * 1000));
  }
}
```

To check your plan's limits and your usage at any time, use [Fetch the current token](#fetch-the-current-token).

## Guard indexes

An index can be marked as a **guard**, which hides the value at its pointer from
item data whenever the API is used with a token. Everything else about the item
comes back as normal, and the value can still be written; it just reads back as
though the field was never there.

```ts
await jsonpad.createIndex('rsvps', {
  name: 'Email',
  pathName: 'email',
  pointer: '/email',
  valueType: 'string',
  guard: true,
});

// The email is hidden, but the RSVP can still be submitted from a browser
const item = await jsonpad.createItem('rsvps', {
  data: { name: 'Alice', email: 'alice@example.com' },
});

console.log(item.data); // { name: 'Alice' }
```

This is what makes a token safe to put in a public page: a guarded value is
removed everywhere item data leaves the API, including event snapshots, item
version history and realtime messages.

An [identity](#identities) can read the guarded values in the items it owns by
passing `includeGuarded: true` alongside its credentials:

```ts
const own = await jsonpad.fetchItem('rsvps', item.id, { includeGuarded: true });

console.log(own.data); // { name: 'Alice', email: 'alice@example.com' }
```

Guards only apply to token auth. Your own data is always fully visible in the
jsonpad dashboard.

Because a guard index hides its value, it can't also be used as an alias or for
sorting, filtering or searching — each of those would expose the value through
another channel. Creating or updating an index that combines them is refused.

## Index builds

An index's values are built in the background. `createIndex` returns straight
away with `buildStatus: 'building'`, and so does `updateIndex` when it changes
the index's `pointer`. Until the index is `ready`, requests that depend on its
values are refused with a 409 `INDEX_BUILDING` error: filtering or ordering
items by it, fetching an item by alias, searching the list, and realtime
subscriptions by alias.

Use `waitForIndex` to wait until an index can be used:

```ts
import JSONPad, { IndexBuildError } from '@basementuniverse/jsonpad-sdk';

const index = await jsonpad.createIndex('products', {
  name: 'Price',
  pathName: 'price',
  pointer: '/price',
  valueType: 'number',
  sorting: true,
});

try {
  await jsonpad.waitForIndex('products', index.id);
} catch (error) {
  if (error instanceof IndexBuildError && error.reason === 'failed') {
    // e.g. an alias index where more than one item has the same value
  }
}

const cheapest = await jsonpad.fetchItems('products', { order: 'price' });
```

Each check fetches the index, which counts as a request, so the wait between
checks grows the longer the build takes.

If you'd rather handle it yourself, an `INDEX_BUILDING` error is a
[`JSONPadError`](#jsonpaderror) with `code` 16006 and a `retryAfter` saying how
many seconds to wait. An index whose build failed has `buildStatus: 'failed'`,
and requests that need it are refused with `INDEX_BUILD_FAILED` (16007). Failed
builds aren't retried automatically: fix the problem, then call `rebuildIndex`
to build it again.

```ts
await jsonpad.rebuildIndex('products', 'sku');
await jsonpad.waitForIndex('products', 'sku');
```

Items can still be created, updated and deleted while an index is being built.

## Tags

Lists, items, indexes, identities and tokens can have tags, which are useful for
grouping together everything that belongs to one of your apps.

```ts
const list = await jsonpad.createList({
  name: 'Recipes',
  tags: ['recipe-app', 'production'],
});

// Tags are lowercase: "Recipe-App" is stored as "recipe-app"
await jsonpad.updateList(list.id, { tags: ['recipe-app', 'staging'] });
```

Setting `tags` replaces all of a resource's tags, and an empty array removes
them. Tags can only contain `a-z`, `0-9`, `-` and `_`, and a resource can have
up to 20 tags of up to 50 characters each.

Use the `tagged` parameter to fetch resources by tag:

```ts
// Lists tagged "recipe-app"
await jsonpad.fetchLists({ tagged: 'recipe-app' });

// Lists tagged "recipe-app" or "cookbook-app"
await jsonpad.fetchLists({ tagged: 'recipe-app,cookbook-app' });

// Lists tagged both "recipe-app" and "production"
await jsonpad.fetchLists({ tagged: ['recipe-app', 'production'] });
```

Identities can't set their own tags when registering or updating themselves.

## Password reset and email verification

JSONPad never sends email. Instead it issues single-use tokens, and your app
sends them to the identity (e.g. as a link to your "reset password" page) with
its own branding.

How a token reaches your app depends on the identity group's **token delivery**
setting, which you choose in the dashboard:

- **Returned to the caller** (the default): `requestIdentityPasswordReset()`
  returns the token. Anyone who can call it with your API token can take over
  any identity in the group, so **only call it from a server**, with a token
  that never leaves it.
- **Sent to a webhook**: the token is POSTed to your webhook (signed with the
  group's secret), and the request only returns `{ delivery: 'webhook' }`. This
  is safe to call from a browser.

```ts
// On your server: request a reset token and email it
const result = await jsonpad.requestIdentityPasswordReset({
  group: 'players',
  email: 'alice@example.com',
});

if (result.delivery !== 'webhook' && result.resetToken) {
  await sendEmail(
    result.identity!.email!,
    `https://example.com/reset-password?token=${result.resetToken}`
  );
}

// Always show the same message, whether or not an identity was found
```

```ts
// On your reset password page
await jsonpad.confirmIdentityPasswordReset({
  resetToken: new URLSearchParams(location.search).get('token')!,
  password: newPassword,
});

// The identity is logged out everywhere, and can now log in again
await jsonpad.loginIdentity({
  group: 'players',
  email: 'alice@example.com',
  password: newPassword,
});
```

Email verification works the same way, with
`requestIdentityEmailVerification()` and `confirmIdentityEmailVerification()`.
See the [password reset guide](https://jsonpad.io/docs/identity-password-reset)
for the whole flow, including verifying webhook signatures.

## Signing in with Google or GitHub

Identities can sign in with an account they already have, instead of (or as
well as) a password. Set the provider up for the identity group in the
[dashboard](https://jsonpad.io/identity-groups) first: it needs an OAuth app of
your own at Google or GitHub, and the pages your app returns to.

These methods run in a browser: they keep a verifier in `sessionStorage`
between starting and finishing a sign-in, so only the browser that started one
can finish it.

```ts
// On your sign-in page: a button for each provider you've set up
const providers = await jsonpad.fetchIdentityOAuthProviders('players');

// ...then, when someone clicks one (this goes to Google)
await jsonpad.startIdentityOAuth('google', {
  redirectUrl: 'https://example.com/auth/callback',
});
```

```ts
// On https://example.com/auth/callback
const { identity, token, created } = await jsonpad.completeIdentityOAuth();

// The SDK is now logged in as this identity, as after loginIdentity()
if (created) {
  showWelcomePage(identity);
}
```

A logged-in identity can link more accounts, and unlink them again (its last
way of signing in can't be removed):

```ts
await jsonpad.linkSelfIdentityProvider('github', {
  redirectUrl: 'https://example.com/settings/accounts',
});

const accounts = await jsonpad.fetchSelfIdentityProviders();

await jsonpad.unlinkSelfIdentityProvider('github');
```

See the [OAuth guide](https://jsonpad.io/docs/identity-oauth) for the whole
flow, and the [Google](https://jsonpad.io/docs/identity-oauth-google) and
[GitHub](https://jsonpad.io/docs/identity-oauth-github) setup guides.

## Schema sync

Describe your lists and their indexes in a document (usually a
`jsonpad-schema.json` file in your repository), and `syncSchema` creates and
updates them to match. Lists are keyed by path name and indexes by path name
within their list, so a document contains no ids. Fields that are left out are
left as they are, and nothing is deleted unless you ask for a prune. See
[Schema sync](https://jsonpad.io/docs/schema-sync) for how documents, scopes,
rebuilds and pruning work.

```ts
import JSONPad, { SyncSchemaDocument } from '@basementuniverse/jsonpad-sdk';

const document: SyncSchemaDocument = {
  $schema: 'https://jsonpad.io/schema/sync-v1.json',
  scope: 'recipe-app',
  lists: {
    recipes: {
      name: 'Recipes',
      indexable: true,
      indexes: {
        slug: { pointer: '/slug', alias: true },
      },
    },
  },
};

// See what would change
const plan = await jsonpad.syncSchema(document, { dryRun: true });

// Apply it
const result = await jsonpad.syncSchema(document);
if (!result.applied) {
  console.error(result.blockedBy?.message);
}
```

A sync is all or nothing. If any change would be refused, or a change rebuilds
an index in a list that has items and `allowRebuild` isn't set, nothing is
changed. `syncSchema` still returns the plan in that case, with `applied: false`
and the reason in `blockedBy`, so check `applied` rather than catching an error.

With `prune: true`, a sync also deletes the lists and indexes that the
document's scope manages but the document no longer declares. Only resources a
previous sync with the same scope declared are ever deleted. Deleting a list
that has items, or a guard index, also needs `allowDestructive: true`:

```ts
const result = await jsonpad.syncSchema(document, {
  prune: true,
  allowDestructive: true,
});
```

`moveLists` moves lists to another scope, assigns lists that no scope manages to
a scope, or releases them from their scope (pass `null`). The scope's tag moves
with each list:

```ts
// Move lists by id or path name
await jsonpad.moveLists({ lists: ['recipes'] }, 'cookbook-app');

// Rename a scope
await jsonpad.moveLists({ fromScope: 'recipe-app' }, 'cookbook-app');

// Stop managing a list with schema sync
await jsonpad.moveLists({ lists: ['recipes'] }, null);
```

`exportSchema` describes existing lists as a document, which is the easiest way
to start using schema sync on an account you already have:

```ts
const { document, warnings } = await jsonpad.exportSchema({
  tagged: 'recipe-app',
});
```

The token needs the `sync-schema` permission, plus the permission for each
change a sync makes.

## Command line tool

The `jsonpad` command line tool is in its own package,
[`@basementuniverse/jsonpad-cli`](https://www.npmjs.com/package/@basementuniverse/jsonpad-cli).
See [Command line tool](https://jsonpad.io/docs/command-line-tool) in the docs.

Versions 1.12 to 1.14 of this package included the schema commands. If you
installed this package globally for the command, run
`npm uninstall -g @basementuniverse/jsonpad-sdk` before
`npm install -g @basementuniverse/jsonpad-cli`, or npm refuses to install it.

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
- [Restore an item](#restore-an-item)
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
- [Wait for an index to be built](#wait-for-an-index-to-be-built)
- [Fetch index stats](#fetch-index-stats)
- [Fetch index events](#fetch-index-events)
- [Fetch an index event](#fetch-an-index-event)
- [Update an index](#update-an-index)
- [Rebuild an index](#rebuild-an-index)
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
- [Request a password reset token](#request-a-password-reset-token)
- [Reset a password](#reset-a-password)
- [Request an email verification token](#request-an-email-verification-token)
- [Verify an email address](#verify-an-email-address)
- [Fetch sign-in providers](#fetch-sign-in-providers)
- [Start signing in with a provider](#start-signing-in-with-a-provider)
- [Finish signing in with a provider](#finish-signing-in-with-a-provider)
- [Link a provider account](#link-a-provider-account)
- [Fetch linked provider accounts](#fetch-linked-provider-accounts)
- [Unlink a provider account](#unlink-a-provider-account)

### Tokens

- [Fetch the current token](#fetch-the-current-token)

### Schema sync

- [Sync a schema](#sync-a-schema)
- [Export a schema](#export-a-schema)
- [Move lists between scopes](#move-lists-between-scopes)

## SDK Reference

### Create a list

```ts
function createList(
  data: {
    // The list name
    name?: string;

    // A short description of the list
    description?: string;

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

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

    // Only fetch lists with these tags (see Tags). A comma-separated string matches any of the tags,
    // and an array requires one match from every element
    tagged?: string | string[];
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Include each event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include each event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
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
  eventId: string, // The event id
  parameters?: {
    // Include the event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include the event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
  }
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

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

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

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Filter items by their own readonly status
    // Items in a readonly list can't be modified either, but they aren't
    // treated as readonly by this filter
    readonly?: boolean;

    // Filter for items owned by the identity with this id
    // This is ignored when using identity credentials, since only items owned
    // by that identity will be visible
    identityId?: string;

    // Should we include the item data for each item in the response?
    // Defualt is false
    includeData?: boolean;

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;

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

    // Only fetch items with these tags (see Tags). A comma-separated string matches any of the tags,
    // and an array requires one match from every element
    tagged?: string | string[];
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

    // Filter items by their own readonly status
    // Items in a readonly list can't be modified either, but they aren't
    // treated as readonly by this filter
    readonly?: boolean;

    // Filter for items owned by the identity with this id
    // This is ignored when using identity credentials, since only items owned
    // by that identity will be visible
    identityId?: string;

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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;

    // Only fetch items with these tags (see Tags). A comma-separated string matches any of the tags,
    // and an array requires one match from every element
    tagged?: string | string[];
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;

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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
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
      | 'item-restored'
      | 'item-deleted';

    // Filter for events after this date
    startAt?: Date;

    // Filter for events before this date
    endAt?: Date;

    // Only return events that the item can be restored from
    restorable?: boolean;

    // Include each event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;

    // Include each event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
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
  eventId: string, // The event id
  parameters?: {
    // Include the event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;

    // Include the event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
  },
  identity?: {
    // Ignore cached identity credentials and don't send them with the request
    ignore?: boolean;

    // Set the identity group, or override cached identity group
    group?: string;

    // Set the identity token, or override cached identity token
    token?: string;
  }
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

### Restore an item

Restore an item to the state it was in when the specified event was created. The item's `data`, `description`, `readonly` and `activated` fields will be restored, and a new version will be created.

This can also be used to restore an item that has been deleted, in which case the item will be re-created with the same id. Deleted items must be referenced by id (not by alias).

Use `fetchItemEvents` with `restorable: true` to find events that an item can be restored from.

Restoring an item requires the `restore` (or `restore-with-identity`) token permission.

```ts
function restoreItem(
  listId: string, // The list id or path name
  itemId: string, // The item id or alias (deleted items must be referenced by id)
  eventId: string, // The id of an item-created, item-updated, item-restored or item-deleted event for this item
  parameters?: {
    // Should we include the item data in the response?
    // Default is true
    includeData?: boolean;

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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
const item: Item = await jsonpad.restoreItem(
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

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Include guarded values in the response?
    // Values covered by a guard index are removed from item data in token auth
    // mode. When using identity credentials, this returns the guarded values in
    // the items owned by that identity
    // Default is false
    includeGuarded?: boolean;
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

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

    // The path name of index, used in API paths and SDK methods
    pathName: string;

    // The JSON Pointer to the field to index
    pointer: string;

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

    // Should this index be a guard index?
    // The value at a guard index's pointer is removed from item data in
    // responses in token auth mode. The value can still be written
    // A guard index can't also be used as an alias, or for sorting, filtering
    // or searching, because each of those would expose the value it hides
    // Default is false
    guard?: boolean;

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
    pointer: '/name',
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
      | 'guard'
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

    // Filter indexes by guard status
    guard?: boolean;

    // Filter indexes by default order direction
    defaultOrderDirection?:
      | 'asc'
      | 'desc';

    // Only fetch indexes with these tags (see Tags). A comma-separated string matches any of the tags,
    // and an array requires one match from every element
    tagged?: string | string[];
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

### Wait for an index to be built

Resolves with the index once its `buildStatus` is `'ready'`. Throws an
[`IndexBuildError`](#indexbuilderror) if the build fails, or if the index isn't
ready before the timeout. A check that's rate limited is retried after the delay
the API asks for, as long as that's before the timeout. See
[Index builds](#index-builds).

```ts
function waitForIndex(
  listId: string, // The list id or path name
  indexId: string, // The index id or path name
  options?: {
    // How long to wait before giving up, in milliseconds
    // Default is 300000 (5 minutes)
    timeout?: number;

    // How long to wait before checking again, in milliseconds
    // This grows by half after each check, up to maxInterval
    // Each check fetches the index, which counts as a request
    // Default is 500
    interval?: number;

    // The longest wait between checks, in milliseconds
    // Default is 10000
    maxInterval?: number;
  }
): Promise<Index>;
```

Example:

```ts
const index: Index = await jsonpad.waitForIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6',
  { timeout: 60000 }
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

    // Include each event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include each event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
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
  eventId: string, // The event id
  parameters?: {
    // Include the event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include the event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
  }
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

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

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

    // Should this index be a guard index?
    // The value at a guard index's pointer is removed from item data in
    // responses in token auth mode. The value can still be written
    // A guard index can't also be used as an alias, or for sorting, filtering
    // or searching, because each of those would expose the value it hides
    guard?: boolean;

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

### Rebuild an index

Start a new build for an index whose last build failed, once the problem has
been fixed. Returns the index with `buildStatus: 'building'`. Only a failed
index can be rebuilt: an index that is ready or already building is refused
with `INDEX_BUILD_NOT_FAILED` (16008). See [Index builds](#index-builds).

```ts
function rebuildIndex(
  listId: string, // The list id or path name
  indexId: string // The index id or path name
): Promise<Index>;
```

Example:

```ts
const index: Index = await jsonpad.rebuildIndex(
  '3e3ce22b-ec32-4c9d-956b-27ba00f38aa9',
  '9963146e-aa36-46f9-9f63-497ab9e5d1c6'
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

    // A public name for the identity, e.g. to show who created an item
    // Unlike the name, this isn't used to log in
    displayName?: string | null;

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

    // The identity group
    group?: string;

    // The identity's email address (required if the group requires one)
    // Email addresses are unique within a group, ignoring case
    email?: string | null;

    // The identity password (at least 8 characters)
    password: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.createIdentity({
  name: 'Alice',
  group: 'my-group',
  email: 'alice@example.com',
  password: 'correct-horse',
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

    // Filter identities by display name (partial match, case-insensitive)
    displayName?: string;

    // Only fetch identities with these tags (see Tags). A comma-separated string matches any of the tags,
    // and an array requires one match from every element
    tagged?: string | string[];
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

    // Include each event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include each event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
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
  eventId: string, // The event id
  parameters?: {
    // Include the event's snapshot in the response
    // Default is false
    includeSnapshot?: boolean;

    // Include the event's attachments in the response
    // Default is false
    includeAttachments?: boolean;
  }
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

    // A public name for the identity, e.g. to show who created an item
    // Set this to null to remove the display name
    displayName?: string | null;

    // Tags for grouping related resources, e.g. ["app-x", "production"]
    // Tags are lowercase and can only contain a-z, 0-9, - and _ (at most 20 tags, 50 characters each)
    tags?: string[];

    // The identity group
    group?: string;

    // The identity's email address; set this to null to remove it
    // A new email address isn't verified
    email?: string | null;

    // The identity password (at least 8 characters)
    // Setting a new password logs the identity out everywhere
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
    password: 'correct-horse',
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

    // A public name for the identity, e.g. to show who created an item
    // Unlike the name, this isn't used to log in
    displayName?: string | null;

    // The identity's email address (required if the group requires one)
    email?: string | null;

    // The identity password (at least 8 characters)
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
  email: 'alice@example.com',
  password: 'correct-horse',
});
```

### Login using an identity

```ts
function loginIdentity(
  data: {
    // The identity group
    group?: string;

    // The identity name, or...
    name?: string;

    // ...the identity's email address (ignoring case)
    email?: string;

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
  email: 'alice@example.com',
  password: 'correct-horse',
});
```

Pass either `name` or `email`, not both. An identity can be logged in on several
devices at once.

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
  },
  options?: {
    // Log the identity out on every device, not just this session
    all?: boolean;
  }
): Promise<void>;
```

Example:

```ts
await jsonpad.logoutIdentity();

// Log out everywhere
await jsonpad.logoutIdentity(undefined, { all: true });
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

    // A public name for the identity, e.g. to show who created an item
    // Set this to null to remove the display name
    displayName?: string | null;

    // The identity's email address; a new email address isn't verified
    email?: string | null;

    // The identity password (at least 8 characters)
    // Other sessions for the identity end; this one stays logged in
    password?: string;

    // The current password, required to change the password or email address
    // (unless the identity doesn't have a password)
    currentPassword?: string;
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
  password: 'new-correct-horse',
  currentPassword: 'correct-horse',
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

### Request a password reset token

Only call this from a server, unless the identity group delivers tokens to a
webhook. See [Password reset and email verification](#password-reset-and-email-verification).

```ts
function requestIdentityPasswordReset(
  data: {
    // The identity group
    group?: string;

    // Exactly one of these
    identityId?: string;
    name?: string;
    email?: string;
  }
): Promise<
  | {
      // The token, or null if no activated, unlocked identity matched
      resetToken: string | null;
      expiresAt: Date | null;
      identity: Identity | null;
    }
  | {
      // The group delivers tokens to a webhook; nothing else is returned
      delivery: 'webhook';
    }
>;
```

Example:

```ts
const result = await jsonpad.requestIdentityPasswordReset({
  group: 'my-group',
  email: 'alice@example.com',
});
```

A token can be requested for each identity once a minute. Requesting a new token
replaces the previous one.

### Reset a password

```ts
function confirmIdentityPasswordReset(
  data: {
    // The token from requestIdentityPasswordReset()
    resetToken: string;

    // The new password (at least 8 characters)
    password: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.confirmIdentityPasswordReset({
  resetToken: 'nCG0QLTdHAqefwfylmdn0F0guVP0UbGP9oWpHq2lTvI',
  password: 'new-correct-horse',
});
```

The token can only be used once. The identity is logged out everywhere, and its
email address is marked as verified (the reset link reached it).

### Request an email verification token

Only call this from a server, unless the identity group delivers tokens to a
webhook.

```ts
function requestIdentityEmailVerification(
  data: {
    // The identity group
    group?: string;

    // Exactly one of these
    identityId?: string;
    name?: string;
    email?: string;
  }
): Promise<
  | {
      // Null if no identity matched, or it has no email or is already verified
      verificationToken: string | null;
      expiresAt: Date | null;
      identity: Identity | null;
    }
  | {
      delivery: 'webhook';
    }
>;
```

Example:

```ts
const result = await jsonpad.requestIdentityEmailVerification({
  group: 'my-group',
  name: 'Alice',
});
```

### Verify an email address

```ts
function confirmIdentityEmailVerification(
  data: {
    // The token from requestIdentityEmailVerification()
    verificationToken: string;
  }
): Promise<Identity>;
```

Example:

```ts
const identity: Identity = await jsonpad.confirmIdentityEmailVerification({
  verificationToken: 'nYu0QBv7IroYymu9diaTw28i0TZ2vssgsdVVb8e1ZpM',
});
```

The token only works while the identity's email address is the one it was sent
to.

### Fetch sign-in providers

Fetch the providers enabled for an identity group, so your app can show a
button for each one.

```ts
function fetchIdentityOAuthProviders(
  group?: string
): Promise<IdentityOAuthProvider[]>;
```

Example:

```ts
const providers = await jsonpad.fetchIdentityOAuthProviders('players');

// [{ provider: 'google', name: 'Google' }]
```

### Start signing in with a provider

Send the browser to the provider's sign-in page. `redirectUrl` must be one of
the identity group's redirect URLs, and is where the person comes back to.

```ts
function startIdentityOAuth(
  provider: string,
  options: {
    redirectUrl: string;

    // The identity group, if it isn't the instance's
    group?: string;

    // Go to the provider straight away (default true)
    navigate?: boolean;

    // Somewhere other than sessionStorage to keep the client verifier
    storage?: IdentityOAuthStorage;
  }
): Promise<{ url: string; expiresAt: Date }>;
```

Example:

```ts
await jsonpad.startIdentityOAuth('google', {
  redirectUrl: 'https://example.com/auth/callback',
});
```

### Finish signing in with a provider

Call this on the page the provider sent the person back to. It reads the
parameters from the page's URL, logs in the identity linked to the provider
account (creating one if there isn't one yet), and removes the parameters from
the address bar.

```ts
function completeIdentityOAuth(
  options?: {
    // The return page's URL (default: the current page's)
    url?: string;

    // Tidy the parameters out of the address bar (default true)
    cleanUrl?: boolean;

    storage?: IdentityOAuthStorage;
  }
): Promise<{
  identity: Identity;
  token: string | undefined;
  created: boolean;
}>;
```

Example:

```ts
const { identity, token, created } = await jsonpad.completeIdentityOAuth();
```

It throws a `JSONPadError` if the sign-in failed: code `20018` when the person
cancelled at the provider, `20017` when the sign-in has expired or was already
finished, and `20010` when another identity in the group already has the
account's email address (they should log in and link it themselves).

After linking an account, rather than signing in, `token` is `undefined` and
`created` is `false`.

### Link a provider account

Start linking another provider account to the current identity. The return page
finishes it with `completeIdentityOAuth()`.

```ts
function linkSelfIdentityProvider(
  provider: string,
  options: {
    redirectUrl: string;
    navigate?: boolean;
    storage?: IdentityOAuthStorage;
  },
  identity?: IdentityParameter
): Promise<{ url: string; expiresAt: Date }>;
```

Example:

```ts
await jsonpad.linkSelfIdentityProvider('github', {
  redirectUrl: 'https://example.com/settings/accounts',
});
```

### Fetch linked provider accounts

Fetch the accounts the current identity can sign in with.

```ts
function fetchSelfIdentityProviders(
  identity?: IdentityParameter
): Promise<IdentityProviderAccount[]>;
```

Example:

```ts
const accounts = await jsonpad.fetchSelfIdentityProviders();
```

### Unlink a provider account

Stop the current identity signing in with a provider account. An identity's
last way of signing in can't be removed: it throws a `JSONPadError` with code
`20022` if it has no password and no other linked account.

```ts
function unlinkSelfIdentityProvider(
  provider: string,
  identity?: IdentityParameter
): Promise<void>;
```

Example:

```ts
await jsonpad.unlinkSelfIdentityProvider('github');
```

### Fetch the current token

Fetch the token making the request, the limits of its subscription plan, and the account's usage for the current month. Any active token can do this, whatever its permissions.

```ts
function fetchSelfToken(): Promise<TokenSelf>;
```

Example:

```ts
const self: TokenSelf = await jsonpad.fetchSelfToken();

console.log(`${self.usage.requestsRemaining} requests left this month`);
```

### Sync a schema

Create and update lists and indexes to match a document. See
[Schema sync](#schema-sync). Returns the plan whether or not it was applied;
other errors, e.g. an invalid document, throw a [`JSONPadError`](#jsonpaderror).

```ts
function syncSchema(
  document: SyncSchemaDocument,
  options?: {
    // Return the plan without changing anything
    dryRun?: boolean;

    // Allow changes that rebuild an index in a list that has items
    allowRebuild?: boolean;

    // Also delete what the document's scope manages but no longer declares
    prune?: boolean;

    // Allow a prune to delete lists that have items, and guard indexes
    allowDestructive?: boolean;
  }
): Promise<SyncSchemaResult>;
```

Example:

```ts
const result: SyncSchemaResult = await jsonpad.syncSchema(document, {
  allowRebuild: true,
});

for (const change of result.changes) {
  console.log(change.action, change.list, change.index ?? '');
}
```

### Export a schema

Describe existing lists and their indexes as a document. Filters can be
combined.

```ts
function exportSchema(options?: {
  // Only lists managed by this scope
  scope?: string;

  // Only lists with these tags (see Tags)
  tagged?: string | string[];

  // Only lists with these path names
  lists?: string[];
}): Promise<SyncSchemaExport>;
```

Example:

```ts
const { document, warnings }: SyncSchemaExport = await jsonpad.exportSchema({
  scope: 'recipe-app',
});
```

### Move lists between scopes

Move lists to a scope, or release them from their scope by passing `null`.
Lists are chosen by id or path name, or with `fromScope`, every list a scope
manages. Like `syncSchema`, the result is returned whether or not the move was
applied, so check `applied` and `blockedBy`.

```ts
function moveLists(
  selection: { lists: string[] } | { fromScope: string },
  scope: string | null,
  options?: {
    // Return the plan without changing anything
    dryRun?: boolean;
  }
): Promise<MoveListsResult>;
```

Example:

```ts
const result: MoveListsResult = await jsonpad.moveLists(
  { fromScope: 'recipe-app' },
  'cookbook-app'
);

console.log(`Moved ${result.summary.move} lists`);
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
  IndexBuildStatus,
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
  SyncSchemaDocument,
  SyncSchemaResult,
  SyncSchemaExport,
  MoveListsResult,
  Token,
  TokenPermission,
  TokenSelf,
  SubscriptionPlan,
  Usage,
  ResponseMeta,
  ResponseEvent,
  JSONPadError,
  IndexBuildError,
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

  // The identity that owns this item, or null if the item isn't owned by an
  // identity (e.g. it was created without using an identity, or the identity
  // has since been deleted)
  identity: {
    id: string;
    displayName: string | null;
  } | null;
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
type ItemOrderBy = string | 'createdAt' | 'updatedAt' | 'identityId';
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
  guard: boolean;
  defaultOrderDirection: OrderDirection;
  activated: boolean;
  buildStatus: IndexBuildStatus;
};
```

### `IndexBuildStatus`

```ts
type IndexBuildStatus = 'ready' | 'building' | 'failed';
```

### `IndexEventType`

```ts
type IndexEventType =
  | 'index-created'
  | 'index-updated'
  | 'index-deleted'
  | 'index-built'
  | 'index-build-failed'
  | 'index-build-requested';
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
  | 'guard'
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
  displayName: string | null;
  group: string;
  lastLoginAt: Date | null;
  activated: boolean;

  // Only when the account owner fetches an identity, or an identity fetches
  // itself
  email?: string | null;
  emailVerified?: boolean;
  hasPassword?: boolean;
  providers?: IdentityProviderAccount[];

  // Only from fetchSelfIdentity()
  sessionCount?: number;
};
```

### `IdentityProviderAccount`

```ts
type IdentityProviderAccount = {
  provider: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  lastLoginAt: Date | null;
};
```

### `IdentityOAuthProvider`

```ts
type IdentityOAuthProvider = {
  // e.g. 'google'
  provider: string;

  // e.g. 'Google', for a button
  name: string;
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
  | 'identity-deleted-self'
  | 'identity-sessions-revoked'
  | 'identity-password-reset-requested'
  | 'identity-password-reset'
  | 'identity-email-verification-requested'
  | 'identity-email-verified'
  | 'identity-provider-linked'
  | 'identity-provider-unlinked';
```

### `IdentityOrderBy`

```ts
export type IdentityOrderBy =
  | 'createdAt'
  | 'updatedAt'
  | 'name'
  | 'displayName'
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

  // Only present if the request included includeSnapshot / includeAttachments
  snapshot?: any;
  attachments?: any;
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

### `Token`

```ts
type Token = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string;
  permissions: TokenPermission[];
  ips: string[] | null;
  expiresAt: Date | null;
  activated: boolean;
  locked: boolean;
};
```

### `TokenPermission`

See [Token permissions](https://jsonpad.io/docs/token-permissions) for which combinations are valid.

```ts
type TokenPermission = {
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
```

### `TokenSelf`

```ts
type TokenSelf = {
  // The token making the request (the token value itself is not included)
  token: Token;

  // The limits in effect for the request
  plan: SubscriptionPlan;

  // Usage across the whole account, not just this token
  usage: Usage;
};
```

### `SubscriptionPlan`

A `null` limit means there is no limit. If `usage.degraded` is `true`, then `rateLimit` and `maxRequestsPerMinute` are the free tier's rather than the plan's.

```ts
type SubscriptionPlan = {
  id: string;
  name: string;

  // The minimum gap between requests, in milliseconds
  rateLimit: number | null;
  maxRequestsPerMinute: number | null;
  maxRequestsPerMonth: number | null;
  overdraftPercent: number;
  maxStorageBytes: number | null;
  maxLists: number | null;
  maxItemsPerList: number | null;
  maxIndexesPerList: number | null;
  maxItemSize: number | null;
  maxItemVersions: number | null;
  maxTokens: number | null;
  maxIdentities: number | null;
  maxRealtimeConnections: number | null;
  generativeAPI: boolean;
};
```

### `Usage`

```ts
type Usage = {
  periodStart: Date;
  periodEnd: Date;
  requestCount: number;
  blockedCount: number;
  requestAllowance: number | null;

  // Including any overdraft and credits, or null if the plan has no monthly limit
  requestsRemaining: number | null;
  overdraftAllowance: number;
  credits: number;
  storageBytes: number;
  storageAllowance: number | null;

  // True once the allowance and credits have run out, and reads are being
  // served at the free tier's rate limit
  degraded: boolean;
};
```

### `ResponseMeta`

```ts
type ResponseMeta = {
  // The HTTP status code
  status: number;

  // The request id, which is useful when reporting a problem
  requestId: string | null;

  // The per-minute rate limit, or null if the plan has no per-minute limit
  rateLimit: {
    total: number;

    // How many more requests can be made in the rolling minute, after this one
    remaining: number;
  } | null;

  // The monthly request quota, or null if the request wasn't metered
  quota: {
    // These three are null if the plan has no monthly limit
    total: number | null;
    remaining: number | null;
    credits: number | null;

    resetAt: Date;

    // True if the allowance and credits have run out, and this read was served
    // at the free tier's rate limit
    degraded: boolean;
  } | null;

  // On a 429 response, how many seconds to wait before retrying
  retryAfter: number | null;
};
```

### `ResponseEvent`

```ts
class ResponseEvent extends Event {
  type: 'response';
  detail: ResponseMeta;
}
```

### `JSONPadError`

See [Errors](https://jsonpad.io/docs/errors) for a list of error codes.

```ts
class JSONPadError extends Error {
  // The raw response body
  message: string;

  // The HTTP status code, e.g. 429
  status: number;

  // The jsonpad error code, e.g. 10007, or null if the response wasn't a jsonpad error
  code: number | null;

  // The jsonpad error name, e.g. 'RATE_LIMIT_EXCEEDED'
  errorName: string | null;

  // How many seconds to wait before retrying, on a 429 response or a 409
  // INDEX_BUILDING response
  retryAfter: number | null;

  // Rate limit and quota information from the response
  meta: ResponseMeta;
}
```

### `IndexBuildError`

Thrown by [`waitForIndex`](#wait-for-an-index-to-be-built).

```ts
class IndexBuildError extends Error {
  // 'failed' if the index's build failed, 'timeout' if it wasn't ready in time
  reason: 'failed' | 'timeout';

  // The index as it was when waiting stopped
  index: Index;
}
```

### `SyncSchemaDocument`

```ts
type SyncSchemaDocument = {
  $schema?: string;
  scope?: string;

  // Keyed by path name
  lists: Record<string, SyncSchemaListDefinition>;
};

type SyncSchemaListDefinition = {
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

  // Keyed by path name
  indexes?: Record<string, SyncSchemaIndexDefinition>;
};

type SyncSchemaIndexDefinition = {
  name?: string;
  description?: string;
  tags?: string[];
  pointer?: string; // Required when the index is created
  valueType?: 'string' | 'number' | 'date';
  alias?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  searching?: boolean;
  guard?: boolean;
  defaultOrderDirection?: 'asc' | 'desc';
};
```

### `SyncSchemaResult`

```ts
type SyncSchemaResult = {
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

  // Why the sync wasn't applied (or, in a dry run, wouldn't be)
  blockedBy: { name: string; code: number; message: string } | null;
};

type SyncSchemaChange = {
  resourceType: 'list' | 'index';
  list: string;
  index?: string;
  listId?: string;
  indexId?: string;
  action: 'create' | 'update' | 'adopt' | 'delete' | 'no-change' | 'error';
  fields?: Record<string, { from: any; to: any }>;
  build?: {
    reason: 'created' | 'pointerChanged';
    items: number;
    requiresConfirmation: boolean;
    buildStatus?: IndexBuildStatus;
  };

  // For a resource a prune deletes. items and indexes are for lists only
  delete?: {
    items?: number;
    indexes?: number;
    destructive: boolean;
  };
  warnings?: string[];
  errors?: { name: string; code: number; message: string }[];
};
```

### `SyncSchemaExport`

```ts
type SyncSchemaExport = {
  document: SyncSchemaDocument & { $schema: string };
  warnings: string[];
};
```

### `MoveListsResult`

```ts
type MoveListsResult = {
  moveId: string;
  dryRun: boolean;
  applied: boolean;

  // The scope the lists were moved to, or null if they were released
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

  // Why the move wasn't applied (or, in a dry run, wouldn't be)
  blockedBy: { name: string; code: number; message: string } | null;
};

type MoveListsChange = {
  // The list's path name (or id), or the requested list if it wasn't found
  list: string;
  listId?: string;
  action: 'move' | 'assign' | 'release' | 'no-change' | 'error';
  from?: string | null;
  to?: string | null;

  // How many of the list's managed indexes move (or are released) with it
  indexes?: number;
  fields?: Record<string, { from: any; to: any }>;
  warnings?: string[];
  errors?: { name: string; code: number; message: string }[];
};
```
