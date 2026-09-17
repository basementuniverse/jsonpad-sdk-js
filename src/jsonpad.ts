import * as constants from './constants';
import { IndexBuildError, JSONPadError } from './errors';
import { ResponseEvent } from './events';
import { Event, Identity, Index, Item, List, Token } from './models';
import {
  CompleteIdentityOAuthOptions,
  EventOrderBy,
  IdentityEventType,
  IdentityOAuthProvider,
  IdentityProviderAccount,
  IdentityOrderBy,
  IdentityParameter,
  IdentityStats,
  IdentityTokenRequest,
  IdentityTokenRequestResult,
  IndexEventType,
  IndexOrderBy,
  IndexStats,
  IndexValueType,
  ItemEventType,
  ItemOrderBy,
  ItemStats,
  JSONPatch,
  ListEventType,
  ListOrderBy,
  ListStats,
  OrderDirection,
  PaginatedRequest,
  PaginatedResponse,
  ResponseMeta,
  SearchResult,
  StartIdentityOAuthOptions,
  ExportSchemaOptions,
  MoveListsOptions,
  MoveListsResult,
  MoveListsSelection,
  SyncSchemaDocument,
  SyncSchemaExport,
  SyncSchemaOptions,
  SyncSchemaResult,
  TokenSelf,
  Usage,
} from './types';
import exclude from './utilities/exclude';
import {
  cleanCurrentUrl,
  createClientVerifier,
  getStorage,
  storageKey,
} from './utilities/oauth';
import sendRequest from './utilities/request';

export type JSONPadOptions = {
  /**
   * The API's base URL, e.g. for a local development server. Defaults to
   * https://api.jsonpad.io
   */
  apiUrl?: string;
};

export class JSONPad extends EventTarget {
  private lastResponseMeta: ResponseMeta | null = null;

  private apiUrl: string;

  /**
   * Create a new JSONPad client instance
   */
  public constructor(
    private token: string,
    private identityGroup?: string,
    private identityToken?: string,
    options: JSONPadOptions = {}
  ) {
    super();
    this.apiUrl = (options.apiUrl ?? constants.API_URL).replace(/\/+$/, '');
  }

  /**
   * Rate limit and quota information from the most recent response, or null
   * if no requests have been made yet
   *
   * When requests are made concurrently, this is whichever response arrived
   * last. Listen for the 'response' event to see every one.
   */
  public get lastResponse(): ResponseMeta | null {
    return this.lastResponseMeta;
  }

  /**
   * Listen for events
   *
   * A 'response' event is dispatched every time a response is received,
   * whether or not the request succeeded. Its detail contains rate limit and
   * quota information.
   */
  public addEventListener(
    type: 'response',
    listener: ((event: ResponseEvent) => void) | null,
    options?: boolean | AddEventListenerOptions
  ): void;
  public addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;
  public addEventListener(
    type: string,
    listener: any,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  /**
   * Stop listening for events
   */
  public removeEventListener(
    type: 'response',
    listener: ((event: ResponseEvent) => void) | null,
    options?: boolean | EventListenerOptions
  ): void;
  public removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions
  ): void;
  public removeEventListener(
    type: string,
    listener: any,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
  }

  /**
   * Make a request to the API, and publish the rate limit and quota
   * information from its response whether or not the request succeeded
   */
  private async request<T = any>(
    ...args: Parameters<typeof sendRequest>
  ): Promise<T | null> {
    const [token, method, path, parameters, body, group, identityToken] = args;

    try {
      const { data, meta } = await sendRequest<T>(
        token,
        method,
        path,
        parameters,
        body,
        group,
        identityToken,
        this.apiUrl
      );
      this.handleResponse(meta);

      return data;
    } catch (error) {
      if (error instanceof JSONPadError) {
        this.handleResponse(error.meta);
      }

      throw error;
    }
  }

  private handleResponse(meta: ResponseMeta) {
    this.lastResponseMeta = meta;
    this.dispatchEvent(new ResponseEvent(meta));
  }

  // ---------------------------------------------------------------------------
  // LISTS
  // #region lists
  // ---------------------------------------------------------------------------

  /**
   * Create a new list
   */
  public async createList(data: Partial<List>): Promise<List> {
    return new List(
      (await this.request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'POST',
        '/lists',
        undefined,
        data
      ))!
    );
  }

  /**
   * Fetch a page of lists
   */
  public async fetchLists(
    parameters?: Partial<
      PaginatedRequest<ListOrderBy> & {
        name: string;
        pathName: string;
        pinned: boolean;
        readonly: boolean;
        realtime: boolean;
        indexable: boolean;
        protected: boolean;
        generative: boolean;
        tagged: string | string[];
      }
    >
  ): Promise<PaginatedResponse<List>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof List>[0]>
    >(this.token, 'GET', '/lists', parameters);

    return {
      ...result!,
      data: result!.data.map(datum => new List(datum)),
    };
  }

  /**
   * Fetch a specific list
   */
  public async fetchList(listId: string): Promise<List> {
    return new List(
      (await this.request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'GET',
        `/lists/${listId}`
      ))!
    );
  }

  /**
   * Search for items in a list
   */
  public async searchList(
    listId: string,
    query: string,
    parameters?: Partial<{
      includeItems: boolean;
      includeData: boolean;
      includeGuarded: boolean;
    }>
  ): Promise<SearchResult[]> {
    return (await this.request<
      ({
        relevance: number;
      } & (
        | {
            id: string;
          }
        | {
            item: ConstructorParameters<typeof Item>[0];
          }
      ))[]
    >(this.token, 'GET', `/lists/${listId}/search`, {
      query,
      ...parameters,
    }))!.map((result): SearchResult => {
      if ('item' in result) {
        return {
          relevance: result.relevance,
          item: new Item(result.item),
        };
      }

      return result;
    });
  }

  /**
   * Fetch stats for a list
   */
  public async fetchListStats(
    listId: string,
    parameters?: Partial<{
      days: number;
    }>
  ): Promise<ListStats> {
    return (await this.request<ListStats>(
      this.token,
      'GET',
      `/lists/${listId}/stats`,
      parameters
    ))!;
  }

  /**
   * Fetch a page of events for a list
   */
  public async fetchListEvents(
    listId: string,
    parameters?: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ListEventType;
        includeSnapshot: boolean;
        includeAttachments: boolean;
      }
    >
  ): Promise<PaginatedResponse<Event>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Event>[0]>
    >(this.token, 'GET', `/lists/${listId}/events`, parameters);

    return {
      ...result!,
      data: result!.data.map(datum => new Event(datum)),
    };
  }

  /**
   * Fetch a specific event for a list
   */
  public async fetchListEvent(
    listId: string,
    eventId: string,
    parameters?: Partial<{
      includeSnapshot: boolean;
      includeAttachments: boolean;
    }>
  ): Promise<Event> {
    return new Event(
      (await this.request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/events/${eventId}`,
        parameters
      ))!
    );
  }

  /**
   * Update a list
   */
  public async updateList(listId: string, data: Partial<List>): Promise<List> {
    return new List(
      (await this.request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}`,
        undefined,
        data
      ))!
    );
  }

  /**
   * Delete a list
   */
  public async deleteList(listId: string) {
    await this.request(this.token, 'DELETE', `/lists/${listId}`);
  }

  // #endregion

  // ---------------------------------------------------------------------------
  // ITEMS
  // #region items
  // ---------------------------------------------------------------------------

  /**
   * Create a new item
   */
  public async createItem(
    listId: string,
    data: Partial<Item>,
    parameters?: Partial<{
      generate: boolean;
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items`,
        parameters,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Fetch a page of items
   */
  public async fetchItems<T = any>(
    listId: string,
    parameters?: Partial<
      PaginatedRequest<ItemOrderBy> & {
        alias: string;
        readonly: boolean;
        identityId: string;
        includeData: boolean;
        includeGuarded: boolean;
        path: string;
        tagged: string | string[];
        [key: string]: any;
      }
    >,
    identity?: IdentityParameter
  ): Promise<PaginatedResponse<Item<T>>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Item<T>>[0]>
    >(
      this.token,
      'GET',
      `/lists/${listId}/items`,
      parameters,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    return {
      ...result!,
      data: result!.data.map(datum => new Item<T>(datum)),
    };
  }

  /**
   * Fetch a page of items, and only return each item's data or a part of the
   * item's data
   */
  public async fetchItemsData<T = any>(
    listId: string,
    parameters?: Partial<
      PaginatedRequest<ItemOrderBy> & {
        path: string;
        pointer: string;
        alias: string;
        readonly: boolean;
        identityId: string;
        includeGuarded: boolean;
        tagged: string | string[];
        [key: string]: any;
      }
    >,
    identity?: IdentityParameter
  ): Promise<PaginatedResponse<T>> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';
    const result = await this.request<PaginatedResponse<T>>(
      this.token,
      'GET',
      `/lists/${listId}/items/data${pointerString}`,
      parameters ? exclude(parameters, 'pointer') : undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    return result!;
  }

  /**
   * Fetch a specific item
   */
  public async fetchItem(
    listId: string,
    itemId: string,
    parameters?: Partial<{
      version: string;
      includeData: boolean;
      includeGuarded: boolean;
      path: string;
      generate: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/items/${itemId}`,
        parameters,
        undefined,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Fetch a specific item, and only return the item's data or a part of the
   * item's data
   */
  public async fetchItemData<T = any>(
    listId: string,
    itemId: string,
    parameters?: Partial<{
      path: string;
      pointer: string;
      version: string;
      generate: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<T> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';

    return (await this.request<T>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/data${pointerString}`,
      parameters ? exclude(parameters, 'pointer') : undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    ))!;
  }

  /**
   * Fetch stats for an item
   */
  public async fetchItemStats(
    listId: string,
    itemId: string,
    parameters?: Partial<{
      days: number;
    }>,
    identity?: IdentityParameter
  ): Promise<ItemStats> {
    return (await this.request<ItemStats>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/stats`,
      parameters,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    ))!;
  }

  /**
   * Fetch a page of events for an item
   */
  public async fetchItemEvents(
    listId: string,
    itemId: string,
    parameters?: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ItemEventType;
        restorable: boolean;
        includeSnapshot: boolean;
        includeAttachments: boolean;
        includeGuarded: boolean;
      }
    >,
    identity?: IdentityParameter
  ): Promise<PaginatedResponse<Event>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Event>[0]>
    >(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/events`,
      parameters,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    return {
      ...result!,
      data: result!.data.map(datum => new Event(datum)),
    };
  }

  /**
   * Fetch a specific event for an item
   */
  public async fetchItemEvent(
    listId: string,
    itemId: string,
    eventId: string,
    parameters?: Partial<{
      includeSnapshot: boolean;
      includeAttachments: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Event> {
    return new Event(
      (await this.request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/items/${itemId}/events/${eventId}`,
        parameters,
        undefined,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Restore an item to the state it was in when the specified event was
   * created, re-creating the item if it has been deleted
   */
  public async restoreItem(
    listId: string,
    itemId: string,
    eventId: string,
    parameters?: Partial<{
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items/${itemId}/events/${eventId}/restore`,
        parameters,
        undefined,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Update an item
   */
  public async updateItem(
    listId: string,
    itemId: string,
    data: Partial<Item>,
    parameters?: Partial<{
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}`,
        parameters,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Update an item's data
   */
  public async updateItemData<T = any>(
    listId: string,
    itemId: string,
    data: T,
    parameters?: Partial<{
      pointer: string;
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        parameters,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Replace an item's data
   */
  public async replaceItemData<T = any>(
    listId: string,
    itemId: string,
    data: T,
    parameters?: Partial<{
      pointer: string;
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        parameters,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Patch an item's data
   */
  public async patchItemData(
    listId: string,
    itemId: string,
    patch: JSONPatch,
    parameters?: Partial<{
      pointer: string;
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        parameters,
        patch,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Delete an item
   */
  public async deleteItem(
    listId: string,
    itemId: string,
    identity?: IdentityParameter
  ) {
    await this.request(
      this.token,
      'DELETE',
      `/lists/${listId}/items/${itemId}`,
      undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );
  }

  /**
   * Delete part of an item's data
   */
  public async deleteItemData(
    listId: string,
    itemId: string,
    parameters?: Partial<{
      pointer: string;
      includeData: boolean;
      includeGuarded: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters?.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await this.request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'DELETE',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        parameters,
        undefined,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  // #endregion

  // ---------------------------------------------------------------------------
  // INDEXES
  // #region indexes
  // ---------------------------------------------------------------------------

  /**
   * Create a new index
   */
  public async createIndex(
    listId: string,
    data: Partial<Index>
  ): Promise<Index> {
    return new Index(
      (await this.request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/indexes`,
        undefined,
        data
      ))!
    );
  }

  /**
   * Fetch a page of indexes
   */
  public async fetchIndexes(
    listId: string,
    parameters?: Partial<
      PaginatedRequest<IndexOrderBy> & {
        name: string;
        pathName: string;
        valueType: IndexValueType;
        alias: boolean;
        guard: boolean;
        defaultOrderDirection: OrderDirection;
        tagged: string | string[];
      }
    >
  ): Promise<PaginatedResponse<Index>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Index>[0]>
    >(this.token, 'GET', `/lists/${listId}/indexes`, parameters);

    return {
      ...result!,
      data: result!.data.map(datum => new Index(datum)),
    };
  }

  /**
   * Fetch a specific index
   */
  public async fetchIndex(listId: string, indexId: string): Promise<Index> {
    return new Index(
      (await this.request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/indexes/${indexId}`
      ))!
    );
  }

  /**
   * Fetch stats for an index
   */
  public async fetchIndexStats(
    listId: string,
    indexId: string,
    parameters?: Partial<{
      days: number;
    }>
  ): Promise<IndexStats> {
    return (await this.request<IndexStats>(
      this.token,
      'GET',
      `/lists/${listId}/indexes/${indexId}/stats`,
      parameters
    ))!;
  }

  /**
   * Fetch a page of events for an index
   */
  public async fetchIndexEvents(
    listId: string,
    indexId: string,
    parameters?: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IndexEventType;
        includeSnapshot: boolean;
        includeAttachments: boolean;
      }
    >
  ): Promise<PaginatedResponse<Event>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Event>[0]>
    >(
      this.token,
      'GET',
      `/lists/${listId}/indexes/${indexId}/events`,
      parameters
    );

    return {
      ...result!,
      data: result!.data.map(datum => new Event(datum)),
    };
  }

  /**
   * Fetch a specific event for an index
   */
  public async fetchIndexEvent(
    listId: string,
    indexId: string,
    eventId: string,
    parameters?: Partial<{
      includeSnapshot: boolean;
      includeAttachments: boolean;
    }>
  ): Promise<Event> {
    return new Event(
      (await this.request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/indexes/${indexId}/events/${eventId}`,
        parameters
      ))!
    );
  }

  /**
   * Update an index
   */
  public async updateIndex(
    listId: string,
    indexId: string,
    data: Partial<Index>
  ): Promise<Index> {
    return new Index(
      (await this.request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/indexes/${indexId}`,
        undefined,
        data
      ))!
    );
  }

  /**
   * Start a new build for an index whose last build failed
   *
   * Failed builds are never retried automatically, so fix the problem (e.g.
   * items sharing an alias value) and then call this. The index is returned
   * with `buildStatus: 'building'`; use waitForIndex to wait for it. Refused
   * with a 409 INDEX_BUILD_NOT_FAILED error if the index is ready or already
   * being built
   */
  public async rebuildIndex(listId: string, indexId: string): Promise<Index> {
    return new Index(
      (await this.request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/indexes/${indexId}/rebuild`
      ))!
    );
  }

  /**
   * Wait for an index to finish building, and return it once it's ready
   *
   * An index is built in the background when it's created and when its pointer
   * changes, and can't be used for filtering, ordering, alias lookups or search
   * until then. Each check fetches the index, which counts as a request, so the
   * delay between checks grows from `interval` up to `maxInterval`.
   *
   * Throws an IndexBuildError if the build fails, or if the index isn't ready
   * within `timeout` milliseconds. A rate limited check is retried after the
   * delay the API asks for, as long as that's within the timeout
   */
  public async waitForIndex(
    listId: string,
    indexId: string,
    options?: Partial<{
      timeout: number;
      interval: number;
      maxInterval: number;
    }>
  ): Promise<Index> {
    const timeout = options?.timeout ?? 5 * 60 * 1000;
    const maxInterval = options?.maxInterval ?? 10 * 1000;
    let interval = options?.interval ?? 500;
    const deadline = Date.now() + timeout;

    for (;;) {
      let index: Index;

      try {
        index = await this.fetchIndex(listId, indexId);
      } catch (error) {
        // Being rate limited doesn't mean the build has failed, so wait as long
        // as the API asks (if that's within the timeout) and check again
        if (!(error instanceof JSONPadError) || error.status !== 429) {
          throw error;
        }

        const wait = (error.retryAfter ?? interval / 1000) * 1000;
        if (Date.now() + wait > deadline) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }

      if (index.buildStatus === 'ready') {
        return index;
      }

      if (index.buildStatus === 'failed') {
        throw new IndexBuildError('failed', index);
      }

      if (Date.now() + interval > deadline) {
        throw new IndexBuildError('timeout', index);
      }

      await new Promise(resolve => setTimeout(resolve, interval));
      interval = Math.min(interval * 1.5, maxInterval);
    }
  }

  /**
   * Delete an index
   */
  public async deleteIndex(listId: string, indexId: string) {
    await this.request(
      this.token,
      'DELETE',
      `/lists/${listId}/indexes/${indexId}`
    );
  }

  // #endregion

  // ---------------------------------------------------------------------------
  // IDENTITIES
  // #region identities
  // ---------------------------------------------------------------------------

  /**
   * Create a new identity
   */
  public async createIdentity(data: {
    group?: string;
    name: string;
    displayName?: string | null;
    email?: string | null;
    password: string;
    tags?: string[];
  }): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'POST',
        '/identities',
        undefined,
        data
      ))!
    );
  }

  /**
   * Fetch a page of identities
   */
  public async fetchIdentities(
    parameters?: Partial<
      PaginatedRequest<IdentityOrderBy> & {
        group: string;
        name: string;
        displayName: string;
        tagged: string | string[];
      }
    >
  ): Promise<PaginatedResponse<Identity>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Identity>[0]>
    >(this.token, 'GET', '/identities', parameters);

    return {
      ...result!,
      data: result!.data.map(datum => new Identity(datum)),
    };
  }

  /**
   * Fetch a specific identity
   */
  public async fetchIdentity(identityId: string): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'GET',
        `/identities/${identityId}`
      ))!
    );
  }

  /**
   * Fetch stats for an identity
   */
  public async fetchIdentityStats(
    identityId: string,
    parameters?: Partial<{
      days: number;
    }>
  ): Promise<IdentityStats> {
    return (await this.request<IdentityStats>(
      this.token,
      'GET',
      `/identities/${identityId}/stats`,
      parameters
    ))!;
  }

  /**
   * Fetch a page of events for an identity
   */
  public async fetchIdentityEvents(
    identityId: string,
    parameters?: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IdentityEventType;
        includeSnapshot: boolean;
        includeAttachments: boolean;
      }
    >
  ): Promise<PaginatedResponse<Event>> {
    const result = await this.request<
      PaginatedResponse<ConstructorParameters<typeof Event>[0]>
    >(this.token, 'GET', `/identities/${identityId}/events`, parameters);

    return {
      ...result!,
      data: result!.data.map(datum => new Event(datum)),
    };
  }

  /**
   * Fetch a specific event for an identity
   */
  public async fetchIdentityEvent(
    identityId: string,
    eventId: string,
    parameters?: Partial<{
      includeSnapshot: boolean;
      includeAttachments: boolean;
    }>
  ): Promise<Event> {
    return new Event(
      (await this.request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/identities/${identityId}/events/${eventId}`,
        parameters
      ))!
    );
  }

  /**
   * Update an identity
   */
  public async updateIdentity(
    identityId: string,
    data: {
      group?: string;
      name?: string;
      displayName?: string | null;
      email?: string | null;
      password?: string;
      tags?: string[];
    }
  ): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'PUT',
        `/identities/${identityId}`,
        undefined,
        data
      ))!
    );
  }

  /**
   * Delete an identity
   */
  public async deleteIdentity(identityId: string) {
    await this.request(this.token, 'DELETE', `/identities/${identityId}`);
  }

  /**
   * Register a new identity
   */
  public async registerIdentity(
    data: {
      group?: string;
      name: string;
      displayName?: string | null;
      email?: string | null;
      password: string;
    },
    identity?: IdentityParameter
  ): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'POST',
        '/identities/register',
        undefined,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Login using an identity, identified by its name or its email address
   */
  public async loginIdentity(
    data: {
      group?: string;
      password: string;
    } & ({ name: string; email?: never } | { email: string; name?: never }),
    identity?: IdentityParameter
  ): Promise<[Identity, string | undefined]> {
    const response = (await this.request<
      ConstructorParameters<typeof Identity>[0] & { token: string }
    >(
      this.token,
      'POST',
      '/identities/login',
      undefined,
      data,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    ))!;

    this.identityGroup = response.group || undefined;
    this.identityToken = response.token || undefined;

    return [
      new Identity(
        exclude(response as any, 'token') as ConstructorParameters<
          typeof Identity
        >[0]
      ),
      this.identityToken,
    ];
  }

  /**
   * Logout using an identity
   *
   * By default only the current session ends; set `all` to log the identity
   * out on every device
   */
  public async logoutIdentity(
    identity?: IdentityParameter,
    options?: { all?: boolean }
  ) {
    await this.request(
      this.token,
      'POST',
      '/identities/logout',
      undefined,
      options?.all ? { all: true } : undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    this.identityGroup = undefined;
    this.identityToken = undefined;
  }

  /**
   * Fetch the current identity
   */
  public async fetchSelfIdentity(
    identity?: IdentityParameter
  ): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'GET',
        '/identities/self',
        undefined,
        undefined,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Update the current identity
   */
  public async updateSelfIdentity(
    data: {
      name?: string;
      displayName?: string | null;
      email?: string | null;
      password?: string;

      // Required to change the password or email address, unless the
      // identity doesn't have a password
      currentPassword?: string;
    },
    identity?: IdentityParameter
  ): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'PUT',
        '/identities/self',
        undefined,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Delete the current identity
   */
  public async deleteSelfIdentity(identity?: IdentityParameter) {
    await this.request(
      this.token,
      'DELETE',
      '/identities/self',
      undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );
  }

  /**
   * Request a password reset token for an identity
   *
   * If the identity group returns tokens to the caller (the default), the
   * token is in the response: only call this from a server, with a token that
   * never leaves it, then send the reset link to the identity yourself. If the
   * group delivers tokens to a webhook, the token is sent there instead, and
   * this is safe to call from a browser
   */
  public async requestIdentityPasswordReset(
    data: IdentityTokenRequest
  ): Promise<IdentityTokenRequestResult<'resetToken', Identity>> {
    return this.requestIdentityToken('/identities/password-reset', data);
  }

  /**
   * Set a new password for an identity, using a password reset token
   *
   * This logs the identity out everywhere; it then needs to log in with its
   * new password
   */
  public async confirmIdentityPasswordReset(data: {
    resetToken: string;
    password: string;
  }): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'POST',
        '/identities/password-reset/confirm',
        undefined,
        data
      ))!
    );
  }

  /**
   * Request an email verification token for an identity
   *
   * As with password reset tokens, only call this from a server unless the
   * identity group delivers tokens to a webhook
   */
  public async requestIdentityEmailVerification(
    data: IdentityTokenRequest
  ): Promise<IdentityTokenRequestResult<'verificationToken', Identity>> {
    return this.requestIdentityToken('/identities/email-verification', data);
  }

  /**
   * Verify an identity's email address, using an email verification token
   */
  public async confirmIdentityEmailVerification(data: {
    verificationToken: string;
  }): Promise<Identity> {
    return new Identity(
      (await this.request<ConstructorParameters<typeof Identity>[0]>(
        this.token,
        'POST',
        '/identities/email-verification/confirm',
        undefined,
        data
      ))!
    );
  }

  /**
   * Fetch the sign-in providers enabled for an identity group, e.g. to show a
   * "Sign in with…" button for each one
   */
  public async fetchIdentityOAuthProviders(
    group?: string
  ): Promise<IdentityOAuthProvider[]> {
    return (await this.request<IdentityOAuthProvider[]>(
      this.token,
      'GET',
      '/identities/oauth/providers',
      { group: group ?? this.identityGroup }
    ))!;
  }

  /**
   * Start signing in with a provider (browser only)
   *
   * This goes to the provider's sign-in page. Afterwards, the person comes
   * back to `redirectUrl`, which should call `completeIdentityOAuth()`
   *
   * If nobody is linked to the provider account yet, completing the sign-in
   * creates a new identity (if the token can register identities)
   */
  public async startIdentityOAuth(
    provider: string,
    options: StartIdentityOAuthOptions & { group?: string }
  ): Promise<{ url: string; expiresAt: Date }> {
    return this.startOAuth(
      `/identities/oauth/${encodeURIComponent(provider)}/start`,
      { group: options.group ?? this.identityGroup },
      options,
      { ignore: true, token: '' }
    );
  }

  /**
   * Finish signing in with a provider (or linking a provider account), on the
   * page the provider sent the person back to (browser only)
   *
   * After signing in, the identity is logged in, as with `loginIdentity()`.
   * `created` is true if a new identity was made for the provider account.
   * After linking an account, `token` is undefined
   */
  public async completeIdentityOAuth(
    options: CompleteIdentityOAuthOptions = {}
  ): Promise<{
    identity: Identity;
    token: string | undefined;
    created: boolean;
  }> {
    const url = options.url ?? (globalThis as any).location?.href;

    if (!url) {
      throw new Error(
        "completeIdentityOAuth() needs the return page's URL; pass a url option"
      );
    }

    const params = new URL(url).searchParams;
    const state = params.get('state');

    if (!state) {
      throw new Error(
        "This page's URL doesn't have a sign-in to complete (there's no state parameter)"
      );
    }

    const storage = getStorage(options.storage);
    const clientVerifier = storage.getItem(storageKey(state));

    if (!clientVerifier) {
      throw new Error(
        'This sign-in was started in another browser or tab, or has already been completed; start signing in again'
      );
    }

    let response: Record<string, any>;
    try {
      response = (await this.request<Record<string, any>>(
        this.token,
        'POST',
        '/identities/oauth/complete',
        undefined,
        {
          state,
          code: params.get('code') ?? undefined,
          error: params.get('error') ?? undefined,
          errorDescription: params.get('error_description') ?? undefined,
          clientVerifier,
        }
      ))!;
    } finally {
      // A sign-in can only be completed once, so the verifier is no use now
      storage.removeItem(storageKey(state));

      if (options.cleanUrl ?? true) {
        cleanCurrentUrl(url);
      }
    }

    if (response.token) {
      this.identityGroup = response.group || undefined;
      this.identityToken = response.token;
    }

    return {
      identity: new Identity(
        exclude(response as any, 'token', 'created') as ConstructorParameters<
          typeof Identity
        >[0]
      ),
      token: response.token || undefined,
      created: !!response.created,
    };
  }

  /**
   * Start linking a provider account to the current identity (browser only),
   * so the identity can sign in with it
   *
   * The return page completes it with `completeIdentityOAuth()`
   */
  public async linkSelfIdentityProvider(
    provider: string,
    options: StartIdentityOAuthOptions,
    identity?: IdentityParameter
  ): Promise<{ url: string; expiresAt: Date }> {
    return this.startOAuth(
      `/identities/self/providers/${encodeURIComponent(provider)}/start`,
      {},
      options,
      identity
    );
  }

  /**
   * Fetch the provider accounts linked to the current identity
   */
  public async fetchSelfIdentityProviders(
    identity?: IdentityParameter
  ): Promise<IdentityProviderAccount[]> {
    const accounts = (await this.request<Record<string, any>[]>(
      this.token,
      'GET',
      '/identities/self/providers',
      undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    ))!;

    return accounts.map(account => ({
      ...(account as IdentityProviderAccount),
      createdAt: new Date(account.createdAt),
      lastLoginAt: account.lastLoginAt ? new Date(account.lastLoginAt) : null,
    }));
  }

  /**
   * Unlink a provider account from the current identity
   *
   * An identity's last way of signing in can't be removed: set a password
   * first, or link another account
   */
  public async unlinkSelfIdentityProvider(
    provider: string,
    identity?: IdentityParameter
  ) {
    await this.request(
      this.token,
      'DELETE',
      `/identities/self/providers/${encodeURIComponent(provider)}`,
      undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );
  }

  /**
   * Start a sign-in or link; signing in passes `{ ignore: true }`, because
   * an identity that's already logged in can't sign in again
   */
  private async startOAuth(
    path: string,
    body: Record<string, any>,
    options: StartIdentityOAuthOptions,
    identity?: IdentityParameter
  ): Promise<{ url: string; expiresAt: Date }> {
    const storage = getStorage(options.storage);
    const [clientVerifier, clientVerifierHash] = await createClientVerifier();

    const response = (await this.request<{ url: string; expiresAt: string }>(
      this.token,
      'POST',
      path,
      undefined,
      { ...body, redirectUrl: options.redirectUrl, clientVerifierHash },
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    ))!;

    const state = new URL(response.url).searchParams.get('state');

    if (state) {
      storage.setItem(storageKey(state), clientVerifier);
    }

    if (options.navigate ?? true) {
      const location = (globalThis as any).location as Location | undefined;

      if (!location) {
        throw new Error(
          "There's no page to navigate from; pass navigate: false and go to the returned url yourself"
        );
      }

      location.assign(response.url);
    }

    return { url: response.url, expiresAt: new Date(response.expiresAt) };
  }

  private async requestIdentityToken(
    path: string,
    data: IdentityTokenRequest
  ): Promise<any> {
    const response = (await this.request<Record<string, any>>(
      this.token,
      'POST',
      path,
      undefined,
      data
    ))!;

    if (response.delivery === 'webhook') {
      return response;
    }

    return {
      ...response,
      expiresAt: response.expiresAt ? new Date(response.expiresAt) : null,
      identity: response.identity ? new Identity(response.identity) : null,
    };
  }

  // #endregion

  // ---------------------------------------------------------------------------
  // TOKENS
  // #region tokens
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current token, the limits of the plan it belongs to, and the
   * account's usage so far this month
   */
  public async fetchSelfToken(): Promise<TokenSelf> {
    const result = (await this.request<
      Omit<TokenSelf, 'token' | 'usage'> & {
        token: ConstructorParameters<typeof Token>[0];
        usage: Omit<Usage, 'periodStart' | 'periodEnd'> & {
          periodStart: string;
          periodEnd: string;
        };
      }
    >(this.token, 'GET', '/tokens/self'))!;

    return {
      token: new Token(result.token),
      plan: result.plan,
      usage: {
        ...result.usage,
        periodStart: new Date(result.usage.periodStart),
        periodEnd: new Date(result.usage.periodEnd),
      },
    };
  }

  // #endregion

  // ---------------------------------------------------------------------------
  // SCHEMA SYNC
  // #region schema sync
  // ---------------------------------------------------------------------------

  /**
   * Create and update lists and indexes to match a schema sync document, and
   * with `prune`, delete the ones its scope manages that it no longer declares
   *
   * The result is returned whether or not the sync was applied: a sync is
   * refused as a whole if any change has an error, if a change would rebuild
   * an index in a list with items and `allowRebuild` isn't set, or if a prune
   * would delete a list that has items (or a guard index) and
   * `allowDestructive` isn't set. Check `applied` and `blockedBy`. Other
   * errors (e.g. an invalid document) throw a JSONPadError
   */
  public async syncSchema(
    document: SyncSchemaDocument,
    options: SyncSchemaOptions = {}
  ): Promise<SyncSchemaResult> {
    return this.requestPlan<SyncSchemaResult>(
      '/sync-schema',
      {
        dryRun: options.dryRun || undefined,
        allowRebuild: options.allowRebuild || undefined,
        prune: options.prune || undefined,
        allowDestructive: options.allowDestructive || undefined,
      },
      document
    );
  }

  /**
   * Move lists to a schema sync scope, or release them from their scope by
   * passing null
   *
   * Lists can be chosen by id or path name, or every list a scope manages can
   * be moved at once (e.g. to rename the scope). A list no scope manages is
   * assigned to the scope. The scope's tag moves with each list. Like a sync,
   * a move is all or nothing, and the result is returned whether or not it
   * was applied: check `applied` and `blockedBy`
   */
  public async moveLists(
    selection: MoveListsSelection,
    scope: string | null,
    options: MoveListsOptions = {}
  ): Promise<MoveListsResult> {
    return this.requestPlan<MoveListsResult>(
      '/sync-schema/move',
      { dryRun: options.dryRun || undefined },
      { ...selection, scope }
    );
  }

  /**
   * Send a schema sync request whose response is a plan. A refused plan is
   * returned rather than thrown, because it describes why it was refused
   */
  private async requestPlan<T>(
    path: string,
    query: Record<string, any>,
    body: any
  ): Promise<T> {
    try {
      return (await this.request<T>(this.token, 'POST', path, query, body))!;
    } catch (error) {
      if (error instanceof JSONPadError && error.status === 422) {
        let responseBody: any = null;
        try {
          responseBody = JSON.parse(error.message);
        } catch {}

        if (responseBody && Array.isArray(responseBody.changes)) {
          const { name, code, message, ...result } = responseBody;

          return result as T;
        }
      }

      throw error;
    }
  }

  /**
   * Describe existing lists and their indexes as a schema sync document
   */
  public async exportSchema(
    options: ExportSchemaOptions = {}
  ): Promise<SyncSchemaExport> {
    return (await this.request<SyncSchemaExport>(
      this.token,
      'GET',
      '/sync-schema',
      {
        scope: options.scope,
        tagged: options.tagged,
        lists: options.lists?.join(','),
      }
    ))!;
  }

  // #endregion
}
