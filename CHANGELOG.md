# Changelog

All notable changes to `@basementuniverse/jsonpad-sdk`.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Dates are npm publish dates. Entries up to and including 1.6.5 were backfilled
on 2026-09-14 from git history and are deliberately brief.

## [1.14.1] - 2026-09-16

### Fixed

- `startAt` and `endAt` in `fetchListEvents()`, `fetchItemEvents()`,
  `fetchIndexEvents()` and `fetchIdentityEvents()` are now sent as ISO 8601
  strings. Previously they were sent in `Date.toString()` format, which the API
  rejected with a validation error.

## [1.14.0] - 2026-09-16

### Deprecated

- The `jsonpad` command line tool, which has moved to its own package,
  `@basementuniverse/jsonpad-cli`, with the same commands, options, output and
  exit codes. It will be removed in 2.0.0. Running it prints a notice to
  stderr, unless `CI` or `JSONPAD_NO_DEPRECATION` is set.

## [1.13.0] - 2026-09-16

### Added

- `prune` and `allowDestructive` options for `syncSchema()`, which delete the
  lists and indexes a scope manages that its document no longer declares. The
  `'delete'` action, `delete` details on changes, and `prune`,
  `summary.delete` and `summary.destructive` in `SyncSchemaResult`.
- `moveLists()`, which moves lists between schema sync scopes, assigns lists to
  a scope or releases them, with the `MoveListsSelection`, `MoveListsOptions`
  and `MoveListsResult` types.
- `--prune` and `--allow-destructive` for `jsonpad sync-schema` (exit code `4`
  when a sync needs `--allow-destructive`), and a `jsonpad move-lists`
  command.

## [1.12.0] - 2026-09-14

### Added

- `rebuildIndex()`, which starts a new build for an index whose last build
  failed. Failed builds are never retried automatically.
- `'index-build-requested'` in `IndexEventType`.
- `syncSchema()` and `exportSchema()` for schema sync, with the
  `SyncSchemaDocument`, `SyncSchemaResult` and `SyncSchemaExport` types, and
  `'sync-schema'` in `TokenPermission`.
- A `jsonpad` command line tool (`npx @basementuniverse/jsonpad-sdk`) with
  `sync-schema`, `export-schema` and `rebuild-index` commands.
- An optional fourth constructor argument, `{ apiUrl }`, for pointing the SDK
  at a different API.

### Changed

- `waitForIndex()` retries a check that was rate limited after the delay the API
  asks for, instead of throwing, as long as that's within the timeout.

## [1.11.0] - 2026-09-13

Indexes are now built in the background by the platform, so an index is not
necessarily usable the moment it is created.

### Added

- `Index.buildStatus` and the `IndexBuildStatus` type. Until an index is
  `ready`, requests that depend on its values — filtering, ordering, alias
  lookups and search — are refused with a `409 INDEX_BUILDING` or
  `INDEX_BUILD_FAILED` error.
- `waitForIndex()`, which polls until the index is ready.
- `IndexBuildError`, thrown by `waitForIndex()` with a `reason` of `'failed'`
  or `'timeout'` and the index as it was when waiting stopped.

### Changed

- `JSONPadError.retryAfter` is now populated for `409 INDEX_BUILDING` responses
  as well as `429`s.

## [1.10.0] - 2026-09-13

### Added

- `tags` on the list, item, index, token and identity models, and tag filtering
  parameters on the corresponding fetch methods.

## [1.9.0] - 2026-09-12

### Added

- `Index.guard`. When set, the value at that index's pointer is removed from
  item data in responses made in token auth mode. The value can still be
  written.
- An `includeGuarded` parameter on the item fetch methods, so an authenticated
  identity can read the guarded values in the items it owns.

## [1.8.0] - 2026-09-12

### Added

- `Identity.displayName`.
- Identity filtering on the item fetch methods, and additional identity
  ordering options.

## [1.7.0] - 2026-09-11

Quota and rate-limit information is now surfaced on every response, and errors
are structured rather than raw strings.

### Added

- `restoreItem()`, which restores a deleted item.
- `fetchSelfToken()`, returning a `TokenSelf` — the token making the request
  (without its value), the plan in effect, and account-wide `Usage` for the
  current month.
- `ResponseMeta`, parsed from the rate-limit and quota response headers:
  `status`, `requestId`, `rateLimit`, `quota` (allowance, remaining, credits,
  reset time, degraded) and `retryAfter`.
- A `'response'` event, dispatched as a `ResponseEvent` every time a response is
  received, whether or not the request succeeded. Listen with
  `addEventListener('response', ...)`.
- `JSONPadError`, carrying `status`, `code`, `errorName`, `meta` and
  `retryAfter`.
- `Usage` and `SubscriptionPlan` types.

### Changed

- Errors thrown by the SDK are now `JSONPadError` instances. The error message
  is still the raw response body, so anything already parsing it keeps working.

## [1.6.5] - 2025-02-08

### Added

- Generic typing for item data, e.g. `fetchItems<MyType>()`.

## [1.6.4] - 2025-02-06

### Fixed

- The wrong HTTP method was used when updating an index.

## [1.6.3] - 2025-02-05

### Added

- Missing type exports.

## [1.6.2] - 2024-12-17

### Fixed

- Incorrect return type when fetching item data.

## [1.6.1] - 2024-12-16

### Changed

- Improved documentation.

## [1.6.0] - 2024-12-15

### Added

- An `includeData` parameter on the item write methods, for skipping item data
  in the response.

## [1.5.0] - 2024-12-14

### Added

- A `path` parameter on `fetchItems()`.

## [1.4.0] - 2024-12-11

### Changed

- List endpoints return a paginated response object rather than a bare array.

## [1.3.5] - 2024-12-09

### Changed

- Re-published. No functional changes.

## [1.3.4] - 2024-12-09

### Changed

- Re-published. No functional changes.

## [1.3.3] - 2024-12-08

### Fixed

- Optional parameters were not handled correctly.

## [1.3.2] - 2024-12-08

### Changed

- User data on models is now optional.

### Fixed

- Identity parameters that should have been ignorable were not.

## [1.3.1] - 2024-12-08

### Changed

- Rebuilt. No functional changes.

## [1.3.0] - 2024-12-08

### Added

- The identities API.
- The identity group and token can be overridden per call.

## [1.2.0] - 2024-11-20

### Changed

- Resources are excluded from the published package, and the build was
  adjusted.

## [1.1.0] - 2024-11-20

### Added

- Generative API fields.

## [1.0.1] - 2024-11-17

### Changed

- Improved documentation.

## [1.0.0] - 2024-11-17

Initial release, alongside the JSONPad launch.

### Added

- Lists, items and indexes — create, fetch, update and delete.
- Events and statistics for lists, items and indexes.
- List search.
- Partial item data access via JSON Path and JSON Pointer, and JSON Patch on
  writes.
- Full TypeScript types, built for both Node and the browser.

---

### A note on 1.7.0

A version `1.7.0` was committed on 2024-12-16 and reset before it was
published; that work shipped as 1.6.1 instead. The 1.7.0 listed above, published
on 2026-09-11, is unrelated to it.
