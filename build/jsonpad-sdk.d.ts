type EventOrderBy = 'createdAt' | 'type';

type EventStream = 'list' | 'item' | 'index';

type IdentityEventType = 'identity-created' | 'identity-updated' | 'identity-deleted' | 'identity-registered' | 'identity-logged-in' | 'identity-logged-out' | 'identity-updated-self' | 'identity-deleted-self';

type IdentityOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'group' | 'activated';

type IdentityParameter = {
    ignore?: boolean;
    group?: string;
    token: string;
};

type Metric<T extends string = string> = {
    [key in T]: number;
};
type Stats<T extends object> = {
    total: number;
    totalThisPeriod: number;
    metrics: ({
        date: Date;
        count: number;
    } & T)[];
};

type IdentityStats = {
    events: Stats<{
        types: Metric<IdentityEventType>;
    }>;
};

type IndexEventType = 'index-created' | 'index-updated' | 'index-deleted';

type IndexOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'pathName' | 'valueType' | 'alias' | 'sorting' | 'filtering' | 'searching' | 'defaultOrderDirection' | 'activated';

type IndexStats = {
    events: Stats<{
        types: Metric<IndexEventType>;
    }>;
};

type IndexValueType = 'string' | 'number' | 'date';

type ItemEventType = 'item-created' | 'item-updated' | 'item-restored' | 'item-deleted';

type ItemOrderBy = string | 'createdAt' | 'updatedAt';

type ItemStats = {
    events: Stats<{
        types: Metric<ItemEventType>;
    }>;
};

type JSONPatch = {
    op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
    [key: string]: any;
}[];

type ListEventType = 'list-created' | 'list-updated' | 'list-deleted';

type ListOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'pathName' | 'pinned' | 'readonly' | 'realtime' | 'indexable' | 'generative' | 'protected' | 'activated';

type ListStats = {
    maxItems?: number | null;
    maxIndexes?: number | null;
    items: Stats<{
        lists: {
            [id: string]: number;
        };
    }>;
    indexes: Stats<{
        lists: {
            [id: string]: number;
        };
    }>;
    events: Stats<{
        types: Metric<ListEventType>;
    }>;
};

type OrderDirection = 'asc' | 'desc';

type PaginatedRequest<T extends string> = {
    page: number;
    limit: number;
    order: T;
    direction: OrderDirection;
};

type PaginatedResponse<T = any> = {
    page: number;
    limit: number;
    total: number;
    data: T[];
};

type SearchResult = {
    relevance: number;
} & ({
    id: string;
} | {
    item: Item;
});

declare class User {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    lastActiveAt: Date | null;
    activated: boolean;
    displayName: string;
    description: string;
    constructor(data: User & {
        createdAt: string;
        updatedAt: string;
        lastActiveAt: string | null;
    });
}

declare class Event {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
    modelId: string;
    stream: EventStream;
    type: ListEventType | ItemEventType | IndexEventType;
    version: string;
    snapshot: any;
    attachments: any;
    constructor(data: Event & {
        createdAt: string;
        updatedAt: string;
        user?: User & {
            createdAt: string;
            updatedAt: string;
            lastActiveAt: string | null;
        };
    });
}

declare class Identity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
    name: string;
    group: string;
    lastLoginAt: Date | null;
    activated: boolean;
    constructor(data: Identity & {
        createdAt: string;
        updatedAt: string;
        user?: User & {
            createdAt: string;
            updatedAt: string;
            lastActiveAt: string | null;
        };
        lastLoginAt: string | null;
    });
}

declare class Index {
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
    constructor(data: Index & {
        createdAt: string;
        updatedAt: string;
    });
}

declare class Item<T = any> {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    data: T;
    description: string;
    version: string;
    readonly: boolean;
    activated: boolean;
    size: number;
    constructor(data: Item<T> & {
        createdAt: string;
        updatedAt: string;
    });
}

declare class List {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    user?: User;
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
    constructor(data: List & {
        createdAt: string;
        updatedAt: string;
        user?: User & {
            createdAt: string;
            updatedAt: string;
            lastActiveAt: string | null;
        };
    });
}

declare class JSONPad {
    private token;
    private identityGroup?;
    private identityToken?;
    /**
     * Create a new JSONPad client instance
     */
    constructor(token: string, identityGroup?: string | undefined, identityToken?: string | undefined);
    /**
     * Create a new list
     */
    createList(data: Partial<List>): Promise<List>;
    /**
     * Fetch a page of lists
     */
    fetchLists(parameters?: Partial<PaginatedRequest<ListOrderBy> & {
        name: string;
        pathName: string;
        pinned: boolean;
        readonly: boolean;
        realtime: boolean;
        indexable: boolean;
        protected: boolean;
        generative: boolean;
    }>): Promise<PaginatedResponse<List>>;
    /**
     * Fetch a specific list
     */
    fetchList(listId: string): Promise<List>;
    /**
     * Search for items in a list
     */
    searchList(listId: string, query: string, parameters?: Partial<{
        includeItems: boolean;
        includeData: boolean;
    }>): Promise<SearchResult[]>;
    /**
     * Fetch stats for a list
     */
    fetchListStats(listId: string, parameters?: Partial<{
        days: number;
    }>): Promise<ListStats>;
    /**
     * Fetch a page of events for a list
     */
    fetchListEvents(listId: string, parameters?: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ListEventType;
    }>): Promise<PaginatedResponse<Event>>;
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
    createItem(listId: string, data: Partial<Item>, parameters?: Partial<{
        generate: boolean;
        includeData: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Fetch a page of items
     */
    fetchItems<T = any>(listId: string, parameters?: Partial<PaginatedRequest<ItemOrderBy> & {
        alias: string;
        readonly: boolean;
        includeData: boolean;
        path: string;
        [key: string]: any;
    }>, identity?: IdentityParameter): Promise<PaginatedResponse<Item<T>>>;
    /**
     * Fetch a page of items, and only return each item's data or a part of the
     * item's data
     */
    fetchItemsData<T = any>(listId: string, parameters?: Partial<PaginatedRequest<ItemOrderBy> & {
        path: string;
        pointer: string;
        alias: string;
        readonly: boolean;
        [key: string]: any;
    }>, identity?: IdentityParameter): Promise<PaginatedResponse<T>>;
    /**
     * Fetch a specific item
     */
    fetchItem(listId: string, itemId: string, parameters?: Partial<{
        version: string;
        includeData: boolean;
        path: string;
        generate: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Fetch a specific item, and only return the item's data or a part of the
     * item's data
     */
    fetchItemData<T = any>(listId: string, itemId: string, parameters?: Partial<{
        path: string;
        pointer: string;
        version: string;
        generate: boolean;
    }>, identity?: IdentityParameter): Promise<T>;
    /**
     * Fetch stats for an item
     */
    fetchItemStats(listId: string, itemId: string, parameters?: Partial<{
        days: number;
    }>): Promise<ItemStats>;
    /**
     * Fetch a page of events for an item
     */
    fetchItemEvents(listId: string, itemId: string, parameters?: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ItemEventType;
    }>): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for an item
     */
    fetchItemEvent(listId: string, itemId: string, eventId: string): Promise<Event>;
    /**
     * Update an item
     */
    updateItem(listId: string, itemId: string, data: Partial<Item>, parameters?: Partial<{
        includeData: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Update an item's data
     */
    updateItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Replace an item's data
     */
    replaceItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Patch an item's data
     */
    patchItemData(listId: string, itemId: string, patch: JSONPatch, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Delete an item
     */
    deleteItem(listId: string, itemId: string, identity?: IdentityParameter): Promise<void>;
    /**
     * Delete part of an item's data
     */
    deleteItemData(listId: string, itemId: string, parameters?: {
        pointer: string;
        includeData: boolean;
    }, identity?: IdentityParameter): Promise<Item>;
    /**
     * Create a new index
     */
    createIndex(listId: string, data: Partial<Index>): Promise<Index>;
    /**
     * Fetch a page of indexes
     */
    fetchIndexes(listId: string, parameters?: Partial<PaginatedRequest<IndexOrderBy> & {
        name: string;
        pathName: string;
        valueType: IndexValueType;
        alias: boolean;
        defaultOrderDirection: OrderDirection;
    }>): Promise<PaginatedResponse<Index>>;
    /**
     * Fetch a specific index
     */
    fetchIndex(listId: string, indexId: string): Promise<Index>;
    /**
     * Fetch stats for an index
     */
    fetchIndexStats(listId: string, indexId: string, parameters?: Partial<{
        days: number;
    }>): Promise<IndexStats>;
    /**
     * Fetch a page of events for an index
     */
    fetchIndexEvents(listId: string, indexId: string, parameters?: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IndexEventType;
    }>): Promise<PaginatedResponse<Event>>;
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
    /**
     * Create a new identity
     */
    createIdentity(data: {
        group?: string;
        name: string;
        password: string;
    }): Promise<Identity>;
    /**
     * Fetch a page of identities
     */
    fetchIdentities(parameters?: Partial<PaginatedRequest<IdentityOrderBy> & {
        group: string;
        name: string;
    }>): Promise<PaginatedResponse<Identity>>;
    /**
     * Fetch a specific identity
     */
    fetchIdentity(identityId: string): Promise<Identity>;
    /**
     * Fetch stats for an identity
     */
    fetchIdentityStats(identityId: string, parameters?: Partial<{
        days: number;
    }>): Promise<IdentityStats>;
    /**
     * Fetch a page of events for an identity
     */
    fetchIdentityEvents(identityId: string, parameters?: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: IdentityEventType;
    }>): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for an identity
     */
    fetchIdentityEvent(identityId: string, eventId: string): Promise<Event>;
    /**
     * Update an identity
     */
    updateIdentity(identityId: string, data: {
        name?: string;
        password?: string;
    }): Promise<Identity>;
    /**
     * Delete an identity
     */
    deleteIdentity(identityId: string): Promise<void>;
    /**
     * Register a new identity
     */
    registerIdentity(data: {
        group?: string;
        name: string;
        password: string;
    }, identity?: IdentityParameter): Promise<Identity>;
    /**
     * Login using an identity
     */
    loginIdentity(data: {
        group?: string;
        name: string;
        password: string;
    }, identity?: IdentityParameter): Promise<[Identity, string | undefined]>;
    /**
     * Logout using an identity
     */
    logoutIdentity(identity?: IdentityParameter): Promise<void>;
    /**
     * Fetch the current identity
     */
    fetchSelfIdentity(identity?: IdentityParameter): Promise<Identity>;
    /**
     * Update the current identity
     */
    updateSelfIdentity(data: {
        name: string;
        password: string;
    }, identity?: IdentityParameter): Promise<Identity>;
    /**
     * Delete the current identity
     */
    deleteSelfIdentity(identity?: IdentityParameter): Promise<void>;
}

export { Event, type EventOrderBy, type EventStream, Identity, type IdentityEventType, type IdentityOrderBy, type IdentityParameter, type IdentityStats, Index, type IndexEventType, type IndexOrderBy, type IndexStats, type IndexValueType, Item, type ItemEventType, type ItemOrderBy, type ItemStats, List, type ListEventType, type ListOrderBy, type ListStats, type OrderDirection, type PaginatedRequest, type PaginatedResponse, type SearchResult, User, JSONPad as default };
