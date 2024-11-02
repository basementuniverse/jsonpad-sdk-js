type Event = {};

type EventOrderBy = 'createdAt' | 'type';

type Index = {};

type IndexOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'pathName' | 'valueType' | 'alias' | 'sorting' | 'filtering' | 'searching' | 'defaultOrderDirection' | 'activated';

type IndexStats = {};

type IndexEventType = 'index-created' | 'index-updated' | 'index-deleted';

type IndexValueType = 'string' | 'number' | 'date';

type Item = {};

type ItemOrderBy = 'createdAt' | 'updatedAt';

type ItemStats = {};

type ItemEventType = 'item-created' | 'item-updated' | 'item-restored' | 'item-deleted';

type List = {};

type ListOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'pathName' | 'pinned' | 'readonly' | 'realtime' | 'indexable' | 'protected' | 'activated';

type ListStats = {};

type ListEventType = 'list-created' | 'list-updated' | 'list-deleted';

type OrderDirection = 'asc' | 'desc';

type PaginatedRequest<T extends string> = {
    page: number;
    limit: number;
    order: T;
    direction: OrderDirection;
};

type SearchResult = {};

type JSONPatch = {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    [key: string]: any;
}[];

declare class JSONPad {
    private token;
    /**
     * Create a new JSONPad client instance
     */
    constructor(token: string);
    /**
     * Create a new list
     */
    createList(data: Partial<List>): Promise<List>;
    /**
     * Fetch a page of lists
     */
    fetchLists(parameters: Partial<PaginatedRequest<ListOrderBy> & {
        name: string;
        pathName: string;
        pinned: boolean;
        readonly: boolean;
        realtime: boolean;
        indexable: boolean;
        protected: boolean;
    }>): Promise<List[]>;
    /**
     * Fetch a specific list
     */
    fetchList(listId: string): Promise<List>;
    /**
     * Search for items in a list
     */
    searchList(listId: string, query: string, parameters: Partial<{
        includeItems: boolean;
        includeData: boolean;
    }>): Promise<SearchResult[]>;
    /**
     * Fetch stats for a list
     */
    fetchListStats(listId: string, parameters: Partial<{
        days: number;
    }>): Promise<ListStats>;
    /**
     * Fetch a page of events for a list
     */
    fetchListEvents(listId: string, parameters: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ListEventType;
    }>): Promise<Event[]>;
    /**
     * Fetch a specific event for a list
     */
    fetchListEvent(listId: string, eventId: string): Promise<Event>;
    /**
     * Update a list
     */
    updateList(listId: string, data: Partial<List>): Promise<List>;
    /**
     * Delete a list
     */
    deleteList(listId: string): Promise<void>;
    /**
     * Create a new item
     */
    createItem(listId: string, data: Partial<Item>): Promise<Item>;
    /**
     * Fetch a page of items
     */
    fetchItems(listId: string, parameters: Partial<PaginatedRequest<ItemOrderBy> & {
        alias: string;
        readonly: boolean;
        includeData: boolean;
        [key: string]: any;
    }>): Promise<Index[]>;
    /**
     * Fetch a page of items, and only return each item's data or a part of the
     * item's data
     */
    fetchItemsData<T = any>(listId: string, parameters: Partial<PaginatedRequest<ItemOrderBy> & {
        path: string;
        pointer: string;
        alias: string;
        readonly: boolean;
        [key: string]: any;
    }>): Promise<T[]>;
    /**
     * Fetch a specific item
     */
    fetchItem(listId: string, itemId: string, parameters: Partial<{
        version: string;
        includeData: boolean;
    }>): Promise<Item>;
    /**
     * Fetch a specific item, and only return the item's data or a part of the
     * item's data
     */
    fetchItemData(listId: string, itemId: string, parameters: Partial<{
        path: string;
        pointer: string;
        version: string;
    }>): Promise<Item>;
    /**
     * Fetch stats for an item
     */
    fetchItemStats(listId: string, itemId: string, parameters: Partial<{
        days: number;
    }>): Promise<ItemStats>;
    /**
     * Fetch a page of events for an item
     */
    fetchItemEvents(listId: string, itemId: string, parameters: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ItemEventType;
    }>): Promise<Event[]>;
    /**
     * Fetch a specific event for an item
     */
    fetchItemEvent(listId: string, itemId: string, eventId: string): Promise<Event>;
    /**
     * Update an item
     */
    updateItem(listId: string, itemId: string, data: Partial<Item>): Promise<Item>;
    /**
     * Update an item's data
     */
    updateItemData(listId: string, itemId: string, data: any, parameters: Partial<{
        pointer: string;
    }>): Promise<Item>;
    /**
     * Replace an item's data
     */
    replaceItemData(listId: string, itemId: string, data: any, parameters: Partial<{
        pointer: string;
    }>): Promise<Item>;
    /**
     * Patch an item's data
     */
    patchItemData(listId: string, itemId: string, patch: JSONPatch, parameters: Partial<{
        pointer: string;
    }>): Promise<Item>;
    /**
     * Delete an item
     */
    deleteItem(listId: string, itemId: string): Promise<void>;
    /**
     * Delete part of an item's data
     */
    deleteItemData(listId: string, itemId: string, parameters: {
        pointer: string;
    }): Promise<Item>;
    /**
     * Create a new index
     */
    createIndex(listId: string, data: Partial<Index>): Promise<Index>;
    /**
     * Fetch a page of indexes
     */
    fetchIndexes(listId: string, parameters: Partial<PaginatedRequest<IndexOrderBy> & {
        name: string;
        pathName: string;
        valueType: IndexValueType;
        alias: boolean;
        defaultOrderDirection: OrderDirection;
    }>): Promise<Index[]>;
    /**
     * Fetch a specific index
     */
    fetchIndex(listId: string, indexId: string): Promise<Index>;
    /**
     * Fetch stats for an index
     */
    fetchIndexStats(listId: string, indexId: string, parameters: Partial<{
        days: number;
    }>): Promise<IndexStats>;
    /**
     * Fetch a page of events for an index
     */
    fetchIndexEvents(listId: string, indexId: string, parameters: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IndexEventType;
    }>): Promise<Event[]>;
    /**
     * Fetch a specific event for an index
     */
    fetchIndexEvent(listId: string, indexId: string, eventId: string): Promise<Event>;
    /**
     * Update an index
     */
    updateIndex(listId: string, indexId: string, data: Partial<Index>): Promise<Index>;
    /**
     * Delete an index
     */
    deleteIndex(listId: string, indexId: string): Promise<void>;
}

export { type List, JSONPad as default };
