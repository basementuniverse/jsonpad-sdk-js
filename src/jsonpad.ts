import { Event, Identity, Index, Item, List } from './models';
import {
  EventOrderBy,
  IdentityEventType,
  IdentityOrderBy,
  IdentityParameter,
  IdentityStats,
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
  SearchResult,
} from './types';
import exclude from './utilities/exclude';
import request from './utilities/request';

export class JSONPad {
  /**
   * Create a new JSONPad client instance
   */
  public constructor(
    private token: string,
    private identityGroup?: string,
    private identityToken?: string
  ) {}

  // ---------------------------------------------------------------------------
  // LISTS
  // #region lists
  // ---------------------------------------------------------------------------

  /**
   * Create a new list
   */
  public async createList(data: Partial<List>): Promise<List> {
    return new List(
      (await request<ConstructorParameters<typeof List>[0]>(
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
    parameters: Partial<
      PaginatedRequest<ListOrderBy> & {
        name: string;
        pathName: string;
        pinned: boolean;
        readonly: boolean;
        realtime: boolean;
        indexable: boolean;
        protected: boolean;
      }
    >
  ): Promise<List[]> {
    const result = await request<{
      data: ConstructorParameters<typeof List>[0][];
    }>(this.token, 'GET', '/lists', parameters);

    return result!.data.map(datum => new List(datum));
  }

  /**
   * Fetch a specific list
   */
  public async fetchList(listId: string): Promise<List> {
    return new List(
      (await request<ConstructorParameters<typeof List>[0]>(
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
    parameters: Partial<{
      includeItems: boolean;
      includeData: boolean;
    }>
  ): Promise<SearchResult[]> {
    return (await request<
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
    parameters: Partial<{
      days: number;
    }>
  ): Promise<ListStats> {
    return (await request<ListStats>(
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
    parameters: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ListEventType;
      }
    >
  ): Promise<Event[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Event>[0][];
    }>(this.token, 'GET', `/lists/${listId}/events`, parameters);

    return result!.data.map(datum => new Event(datum));
  }

  /**
   * Fetch a specific event for a list
   */
  public async fetchListEvent(listId: string, eventId: string): Promise<Event> {
    return new Event(
      (await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/events/${eventId}`
      ))!
    );
  }

  /**
   * Update a list
   */
  public async updateList(listId: string, data: Partial<List>): Promise<List> {
    return new List(
      (await request<ConstructorParameters<typeof List>[0]>(
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
    await request(this.token, 'DELETE', `/lists/${listId}`);
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
    parameters: Partial<{
      generate: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
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
  public async fetchItems(
    listId: string,
    parameters: Partial<
      PaginatedRequest<ItemOrderBy> & {
        alias: string;
        readonly: boolean;
        includeData: boolean;
        [key: string]: any;
      }
    >,
    identity?: IdentityParameter
  ): Promise<Item[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Item>[0][];
    }>(
      this.token,
      'GET',
      `/lists/${listId}/items`,
      parameters,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    return result!.data.map(datum => new Item(datum));
  }

  /**
   * Fetch a page of items, and only return each item's data or a part of the
   * item's data
   */
  public async fetchItemsData<T = any>(
    listId: string,
    parameters: Partial<
      PaginatedRequest<ItemOrderBy> & {
        path: string;
        pointer: string;
        alias: string;
        readonly: boolean;
        [key: string]: any;
      }
    >,
    identity?: IdentityParameter
  ): Promise<T[]> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';
    const result = await request<{ data: T[] }>(
      this.token,
      'GET',
      `/lists/${listId}/items/data${pointerString}`,
      exclude(parameters, 'pointer'),
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );

    return result!.data;
  }

  /**
   * Fetch a specific item
   */
  public async fetchItem(
    listId: string,
    itemId: string,
    parameters: Partial<{
      version: string;
      includeData: boolean;
      generate: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
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
  public async fetchItemData(
    listId: string,
    itemId: string,
    parameters: Partial<{
      path: string;
      pointer: string;
      version: string;
      generate: boolean;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return (await request<Item>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/data${pointerString}`,
      exclude(parameters, 'pointer'),
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
    parameters: Partial<{
      days: number;
    }>
  ): Promise<ItemStats> {
    return (await request<ItemStats>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/stats`,
      parameters
    ))!;
  }

  /**
   * Fetch a page of events for an item
   */
  public async fetchItemEvents(
    listId: string,
    itemId: string,
    parameters: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ItemEventType;
      }
    >
  ): Promise<Event[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Event>[0][];
    }>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/events`,
      parameters
    );

    return result!.data.map(datum => new Event(datum));
  }

  /**
   * Fetch a specific event for an item
   */
  public async fetchItemEvent(
    listId: string,
    itemId: string,
    eventId: string
  ): Promise<Event> {
    return new Event(
      (await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/items/${itemId}/events/${eventId}`
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
    identity?: IdentityParameter
  ): Promise<Item> {
    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}`,
        undefined,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Update an item's data
   */
  public async updateItemData(
    listId: string,
    itemId: string,
    data: any,
    parameters: Partial<{
      pointer: string;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
        data,
        identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
        identity?.ignore ? undefined : identity?.token ?? this.identityToken
      ))!
    );
  }

  /**
   * Replace an item's data
   */
  public async replaceItemData(
    listId: string,
    itemId: string,
    data: any,
    parameters: Partial<{
      pointer: string;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
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
    parameters: Partial<{
      pointer: string;
    }>,
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
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
    await request(
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
    parameters: {
      pointer: string;
    },
    identity?: IdentityParameter
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      (await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'DELETE',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
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
      (await request<ConstructorParameters<typeof Index>[0]>(
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
    parameters: Partial<
      PaginatedRequest<IndexOrderBy> & {
        name: string;
        pathName: string;
        valueType: IndexValueType;
        alias: boolean;
        defaultOrderDirection: OrderDirection;
      }
    >
  ): Promise<Index[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Index>[0][];
    }>(this.token, 'GET', `/lists/${listId}/indexes`, parameters);

    return result!.data.map(datum => new Index(datum));
  }

  /**
   * Fetch a specific index
   */
  public async fetchIndex(listId: string, indexId: string): Promise<Index> {
    return new Index(
      (await request<ConstructorParameters<typeof Index>[0]>(
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
    parameters: Partial<{
      days: number;
    }>
  ): Promise<IndexStats> {
    return (await request<IndexStats>(
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
    parameters: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IndexEventType;
      }
    >
  ): Promise<Event[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Event>[0][];
    }>(
      this.token,
      'GET',
      `/lists/${listId}/indexes/${indexId}/events`,
      parameters
    );

    return result!.data.map(datum => new Event(datum));
  }

  /**
   * Fetch a specific event for an index
   */
  public async fetchIndexEvent(
    listId: string,
    indexId: string,
    eventId: string
  ): Promise<Event> {
    return new Event(
      (await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/indexes/${indexId}/events/${eventId}`
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
      (await request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}/indexes/${indexId}`,
        undefined,
        data
      ))!
    );
  }

  /**
   * Delete an index
   */
  public async deleteIndex(listId: string, indexId: string) {
    await request(this.token, 'DELETE', `/lists/${listId}/indexes/${indexId}`);
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
    name: string;
    group?: string;
    password: string;
  }): Promise<Identity> {
    return new Identity(
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
    parameters: Partial<
      PaginatedRequest<IdentityOrderBy> & {
        group: string;
        name: string;
      }
    >
  ): Promise<Identity[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Identity>[0][];
    }>(this.token, 'GET', '/identities', parameters);

    return result!.data.map(datum => new Identity(datum));
  }

  /**
   * Fetch a specific identity
   */
  public async fetchIdentity(identityId: string): Promise<Identity> {
    return new Identity(
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
    parameters: Partial<{
      days: number;
    }>
  ): Promise<IdentityStats> {
    return (await request<IdentityStats>(
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
    parameters: Partial<
      PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IdentityEventType;
      }
    >
  ): Promise<Event[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Event>[0][];
    }>(this.token, 'GET', `/identities/${identityId}/events`, parameters);

    return result!.data.map(datum => new Event(datum));
  }

  /**
   * Fetch a specific event for an identity
   */
  public async fetchIdentityEvent(
    identityId: string,
    eventId: string
  ): Promise<Event> {
    return new Event(
      (await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/identities/${identityId}/events/${eventId}`
      ))!
    );
  }

  /**
   * Update an identity
   */
  public async updateIdentity(
    identityId: string,
    data: {
      name?: string;
      password?: string;
    }
  ): Promise<Identity> {
    return new Identity(
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
    await request(this.token, 'DELETE', `/identities/${identityId}`);
  }

  /**
   * Register a new identity
   */
  public async registerIdentity(
    data: {
      group: string;
      name: string;
      password: string;
    },
    identity?: IdentityParameter
  ): Promise<Identity> {
    return new Identity(
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
   * Login using an identity
   */
  public async loginIdentity(
    data: {
      group: string;
      name: string;
      password: string;
    },
    identity?: IdentityParameter
  ): Promise<[Identity, string | undefined]> {
    const response = (await request<
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
   */
  public async logoutIdentity(identity?: IdentityParameter) {
    await request(
      this.token,
      'POST',
      '/identities/logout',
      undefined,
      undefined,
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
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
      name: string;
      password: string;
    },
    identity?: IdentityParameter
  ): Promise<Identity> {
    return new Identity(
      (await request<ConstructorParameters<typeof Identity>[0]>(
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
    await request(
      this.token,
      'DELETE',
      '/identities/self',
      undefined,
      undefined,
      identity?.ignore ? undefined : identity?.group ?? this.identityGroup,
      identity?.ignore ? undefined : identity?.token ?? this.identityToken
    );
  }

  // #endregion
}
