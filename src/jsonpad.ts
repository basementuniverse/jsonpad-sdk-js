import { Event, Index, Item, List } from './models';
import {
  EventOrderBy,
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
  public constructor(private token: string) {}

  // ---------------------------------------------------------------------------
  // LISTS
  // ---------------------------------------------------------------------------

  /**
   * Create a new list
   */
  public async createList(data: Partial<List>): Promise<List> {
    return new List(
      await request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'POST',
        '/lists',
        undefined,
        data
      )
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

    return result.data.map(datum => new List(datum));
  }

  /**
   * Fetch a specific list
   */
  public async fetchList(listId: string): Promise<List> {
    return new List(
      await request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'GET',
        `/lists/${listId}`
      )
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
    return (
      await request<
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
      })
    ).map((result): SearchResult => {
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
    return await request<ListStats>(
      this.token,
      'GET',
      `/lists/${listId}/stats`,
      parameters
    );
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

    return result.data.map(datum => new Event(datum));
  }

  /**
   * Fetch a specific event for a list
   */
  public async fetchListEvent(listId: string, eventId: string): Promise<Event> {
    return new Event(
      await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/events/${eventId}`
      )
    );
  }

  /**
   * Update a list
   */
  public async updateList(listId: string, data: Partial<List>): Promise<List> {
    return new List(
      await request<ConstructorParameters<typeof List>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}`,
        undefined,
        data
      )
    );
  }

  /**
   * Delete a list
   */
  public async deleteList(listId: string) {
    await request(this.token, 'DELETE', `/lists/${listId}`);
  }

  // ---------------------------------------------------------------------------
  // ITEMS
  // ---------------------------------------------------------------------------

  /**
   * Create a new item
   */
  public async createItem(
    listId: string,
    data: Partial<Item>,
    parameters: Partial<{
      generate: boolean;
    }>
  ): Promise<Item> {
    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items`,
        parameters,
        data
      )
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
    >
  ): Promise<Item[]> {
    const result = await request<{
      data: ConstructorParameters<typeof Item>[0][];
    }>(this.token, 'GET', `/lists/${listId}/items`, parameters);

    return result.data.map(datum => new Item(datum));
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
    >
  ): Promise<T[]> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';
    const result = await request<{ data: T[] }>(
      this.token,
      'GET',
      `/lists/${listId}/items/data${pointerString}`,
      exclude(parameters, 'pointer')
    );

    return result.data;
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
    }>
  ): Promise<Item> {
    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/items/${itemId}`,
        parameters
      )
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
    }>
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return await request<Item>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/data${pointerString}`,
      exclude(parameters, 'pointer')
    );
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
    return await request<ItemStats>(
      this.token,
      'GET',
      `/lists/${listId}/items/${itemId}/stats`,
      parameters
    );
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

    return result.data.map(datum => new Event(datum));
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
      await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/items/${itemId}/events/${eventId}`
      )
    );
  }

  /**
   * Update an item
   */
  public async updateItem(
    listId: string,
    itemId: string,
    data: Partial<Item>
  ): Promise<Item> {
    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}`,
        undefined,
        data
      )
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
    }>
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
        data
      )
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
    }>
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PUT',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
        data
      )
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
    }>
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}/items/${itemId}/data${pointerString}`,
        undefined,
        patch
      )
    );
  }

  /**
   * Delete an item
   */
  public async deleteItem(listId: string, itemId: string) {
    await request(this.token, 'DELETE', `/lists/${listId}/items/${itemId}`);
  }

  /**
   * Delete part of an item's data
   */
  public async deleteItemData(
    listId: string,
    itemId: string,
    parameters: {
      pointer: string;
    }
  ): Promise<Item> {
    const pointerString = parameters.pointer ? `/${parameters.pointer}` : '';

    return new Item(
      await request<ConstructorParameters<typeof Item>[0]>(
        this.token,
        'DELETE',
        `/lists/${listId}/items/${itemId}/data${pointerString}`
      )
    );
  }

  // ---------------------------------------------------------------------------
  // INDEXES
  // ---------------------------------------------------------------------------

  /**
   * Create a new index
   */
  public async createIndex(
    listId: string,
    data: Partial<Index>
  ): Promise<Index> {
    return new Index(
      await request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'POST',
        `/lists/${listId}/indexes`,
        undefined,
        data
      )
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

    return result.data.map(datum => new Index(datum));
  }

  /**
   * Fetch a specific index
   */
  public async fetchIndex(listId: string, indexId: string): Promise<Index> {
    return new Index(
      await request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/indexes/${indexId}`
      )
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
    return await request<IndexStats>(
      this.token,
      'GET',
      `/lists/${listId}/indexes/${indexId}/stats`,
      parameters
    );
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

    return result.data.map(datum => new Event(datum));
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
      await request<ConstructorParameters<typeof Event>[0]>(
        this.token,
        'GET',
        `/lists/${listId}/indexes/${indexId}/events/${eventId}`
      )
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
      await request<ConstructorParameters<typeof Index>[0]>(
        this.token,
        'PATCH',
        `/lists/${listId}/indexes/${indexId}`,
        undefined,
        data
      )
    );
  }

  /**
   * Delete an index
   */
  public async deleteIndex(listId: string, indexId: string) {
    await request(this.token, 'DELETE', `/lists/${listId}/indexes/${indexId}`);
  }
}
