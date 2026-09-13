/**
 * Rate limit and quota information, read from the headers of an API response
 */
type ResponseMeta = {
    /**
     * The HTTP status code
     */
    status: number;
    /**
     * The request id, which is useful when reporting a problem
     */
    requestId: string | null;
    /**
     * The per-minute rate limit, or null if the plan has no per-minute limit
     */
    rateLimit: {
        /**
         * How many requests the plan allows per minute
         */
        total: number;
        /**
         * How many more requests can be made in the rolling minute, after this one
         */
        remaining: number;
    } | null;
    /**
     * The monthly request quota, or null if the request wasn't metered
     */
    quota: {
        /**
         * The monthly allowance, excluding any overdraft or credits, or null if
         * the plan has no monthly limit
         */
        total: number | null;
        /**
         * How many requests are left before writes are refused, including any
         * overdraft and credits, or null if the plan has no monthly limit
         */
        remaining: number | null;
        /**
         * How many prepaid request credits are held, or null if the plan has no
         * monthly limit
         */
        credits: number | null;
        /**
         * When the monthly allowance resets
         */
        resetAt: Date;
        /**
         * True if the allowance and credits have run out, and this read was served
         * at the free tier's rate limit
         */
        degraded: boolean;
    } | null;
    /**
     * On a 429 response, how many seconds to wait before retrying
     */
    retryAfter: number | null;
};

/**
 * Thrown when the API responds with an error status
 */
declare class JSONPadError extends Error {
    /**
     * The HTTP status code, e.g. 429
     */
    readonly status: number;
    /**
     * The jsonpad error code, e.g. 10007, or null if the response wasn't a
     * jsonpad error
     */
    readonly code: number | null;
    /**
     * The jsonpad error name, e.g. 'RATE_LIMIT_EXCEEDED', or null if the
     * response wasn't a jsonpad error
     */
    readonly errorName: string | null;
    /**
     * Rate limit and quota information from the response
     */
    readonly meta: ResponseMeta;
    constructor(status: number, body: string, meta: ResponseMeta);
    /**
     * On a 429 response, how many seconds to wait before retrying
     */
    get retryAfter(): number | null;
}

/**
 * Dispatched by a JSONPad instance every time it receives a response, whether
 * or not the request succeeded
 *
 * This extends globalThis.Event rather than Event, because the SDK has an
 * Event model of its own that would otherwise shadow it in the bundled type
 * definitions.
 */
declare class ResponseEvent extends globalThis.Event {
    readonly detail: ResponseMeta;
    constructor(detail: ResponseMeta);
}

type EventOrderBy = 'createdAt' | 'type';

type EventStream = 'list' | 'item' | 'index';

type IdentityEventType = 'identity-created' | 'identity-updated' | 'identity-deleted' | 'identity-registered' | 'identity-logged-in' | 'identity-logged-out' | 'identity-updated-self' | 'identity-deleted-self';

type IdentityOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'displayName' | 'group' | 'activated';

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

type IndexOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'pathName' | 'valueType' | 'alias' | 'sorting' | 'filtering' | 'searching' | 'guard' | 'defaultOrderDirection' | 'activated';

type IndexStats = {
    events: Stats<{
        types: Metric<IndexEventType>;
    }>;
};

type IndexValueType = 'string' | 'number' | 'date';

type ItemEventType = 'item-created' | 'item-updated' | 'item-restored' | 'item-deleted';

type ItemOrderBy = string | 'createdAt' | 'updatedAt' | 'identityId';

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

/**
 * The limits of a subscription plan. A null limit means there is no limit.
 */
type SubscriptionPlan = {
    id: string;
    name: string;
    /**
     * The minimum gap between requests, in milliseconds
     */
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

type TokenPermission = {
    mode: 'allow' | 'block';
    action: '*' | 'create' | 'view' | 'update' | 'delete' | 'restore' | 'register' | 'authenticate' | 'create-with-identity' | 'view-with-identity' | 'update-with-identity' | 'delete-with-identity' | 'restore-with-identity';
    resourceType?: 'list' | 'item' | 'index' | 'identity' | 'event' | 'stats';
    listIds?: string[];
    itemIds?: string[];
    indexIds?: string[];
    identityIds?: string[];
    groups?: string[];
};

declare class Token {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    name: string;
    description: string;
    tags: string[];
    permissions: TokenPermission[];
    ips: string[] | null;
    expiresAt: Date | null;
    activated: boolean;
    locked: boolean;
    constructor(data: Token & {
        createdAt: string;
        updatedAt: string;
        expiresAt: string | null;
    });
}

/**
 * An account's usage for the current calendar month
 */
type Usage = {
    periodStart: Date;
    periodEnd: Date;
    requestCount: number;
    blockedCount: number;
    requestAllowance: number | null;
    /**
     * Including any overdraft and credits, or null if the plan has no monthly
     * limit
     */
    requestsRemaining: number | null;
    overdraftAllowance: number;
    credits: number;
    storageBytes: number;
    storageAllowance: number | null;
    /**
     * True if the allowance and credits have run out, and reads are being served
     * at the free tier's rate limit
     */
    degraded: boolean;
};

type TokenSelf = {
    /**
     * The token making the request. The token value itself is not included.
     */
    token: Token;
    /**
     * The limits in effect for the request. If usage.degraded is true, then
     * rateLimit and maxRequestsPerMinute are the free tier's.
     */
    plan: SubscriptionPlan;
    /**
     * Usage across the whole account, not just this token
     */
    usage: Usage;
};

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
    /**
     * Only present if the request included includeSnapshot / includeAttachments
     */
    snapshot?: any;
    attachments?: any;
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
    displayName: string | null;
    tags: string[];
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
    tags: string[];
    pathName: string;
    pointer: string;
    valueType: IndexValueType;
    alias: boolean;
    sorting: boolean;
    filtering: boolean;
    searching: boolean;
    /**
     * When true, the value at this index's pointer is removed from item data in
     * responses in token auth mode
     *
     * The value can still be written. An authenticated identity can read the
     * guarded values in the items it owns by passing includeGuarded
     */
    guard: boolean;
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
    tags: string[];
    version: string;
    readonly: boolean;
    activated: boolean;
    size: number;
    identity: {
        id: string;
        displayName: string | null;
    } | null;
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
    tags: string[];
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

declare class JSONPad extends EventTarget {
    private token;
    private identityGroup?;
    private identityToken?;
    private lastResponseMeta;
    /**
     * Create a new JSONPad client instance
     */
    constructor(token: string, identityGroup?: string | undefined, identityToken?: string | undefined);
    /**
     * Rate limit and quota information from the most recent response, or null
     * if no requests have been made yet
     *
     * When requests are made concurrently, this is whichever response arrived
     * last. Listen for the 'response' event to see every one.
     */
    get lastResponse(): ResponseMeta | null;
    /**
     * Listen for events
     *
     * A 'response' event is dispatched every time a response is received,
     * whether or not the request succeeded. Its detail contains rate limit and
     * quota information.
     */
    addEventListener(type: 'response', listener: ((event: ResponseEvent) => void) | null, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
    /**
     * Stop listening for events
     */
    removeEventListener(type: 'response', listener: ((event: ResponseEvent) => void) | null, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
    /**
     * Make a request to the API, and publish the rate limit and quota
     * information from its response whether or not the request succeeded
     */
    private request;
    private handleResponse;
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
        tagged: string | string[];
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
        includeGuarded: boolean;
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
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for a list
     */
    fetchListEvent(listId: string, eventId: string, parameters?: Partial<{
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<Event>;
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
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Fetch a page of items
     */
    fetchItems<T = any>(listId: string, parameters?: Partial<PaginatedRequest<ItemOrderBy> & {
        alias: string;
        readonly: boolean;
        identityId: string;
        includeData: boolean;
        includeGuarded: boolean;
        path: string;
        tagged: string | string[];
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
        identityId: string;
        includeGuarded: boolean;
        tagged: string | string[];
        [key: string]: any;
    }>, identity?: IdentityParameter): Promise<PaginatedResponse<T>>;
    /**
     * Fetch a specific item
     */
    fetchItem(listId: string, itemId: string, parameters?: Partial<{
        version: string;
        includeData: boolean;
        includeGuarded: boolean;
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
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<T>;
    /**
     * Fetch stats for an item
     */
    fetchItemStats(listId: string, itemId: string, parameters?: Partial<{
        days: number;
    }>, identity?: IdentityParameter): Promise<ItemStats>;
    /**
     * Fetch a page of events for an item
     */
    fetchItemEvents(listId: string, itemId: string, parameters?: Partial<PaginatedRequest<EventOrderBy> & {
        startAt: Date;
        endAt: Date;
        type: ItemEventType;
        restorable: boolean;
        includeSnapshot: boolean;
        includeAttachments: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for an item
     */
    fetchItemEvent(listId: string, itemId: string, eventId: string, parameters?: Partial<{
        includeSnapshot: boolean;
        includeAttachments: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Event>;
    /**
     * Restore an item to the state it was in when the specified event was
     * created, re-creating the item if it has been deleted
     */
    restoreItem(listId: string, itemId: string, eventId: string, parameters?: Partial<{
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Update an item
     */
    updateItem(listId: string, itemId: string, data: Partial<Item>, parameters?: Partial<{
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Update an item's data
     */
    updateItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Replace an item's data
     */
    replaceItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Patch an item's data
     */
    patchItemData(listId: string, itemId: string, patch: JSONPatch, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Delete an item
     */
    deleteItem(listId: string, itemId: string, identity?: IdentityParameter): Promise<void>;
    /**
     * Delete part of an item's data
     */
    deleteItemData(listId: string, itemId: string, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
    }>, identity?: IdentityParameter): Promise<Item>;
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
        guard: boolean;
        defaultOrderDirection: OrderDirection;
        tagged: string | string[];
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
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for an index
     */
    fetchIndexEvent(listId: string, indexId: string, eventId: string, parameters?: Partial<{
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<Event>;
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
        displayName?: string | null;
        password: string;
    }): Promise<Identity>;
    /**
     * Fetch a page of identities
     */
    fetchIdentities(parameters?: Partial<PaginatedRequest<IdentityOrderBy> & {
        group: string;
        name: string;
        displayName: string;
        tagged: string | string[];
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
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<PaginatedResponse<Event>>;
    /**
     * Fetch a specific event for an identity
     */
    fetchIdentityEvent(identityId: string, eventId: string, parameters?: Partial<{
        includeSnapshot: boolean;
        includeAttachments: boolean;
    }>): Promise<Event>;
    /**
     * Update an identity
     */
    updateIdentity(identityId: string, data: {
        name?: string;
        displayName?: string | null;
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
        displayName?: string | null;
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
        name?: string;
        displayName?: string | null;
        password?: string;
    }, identity?: IdentityParameter): Promise<Identity>;
    /**
     * Delete the current identity
     */
    deleteSelfIdentity(identity?: IdentityParameter): Promise<void>;
    /**
     * Fetch the current token, the limits of the plan it belongs to, and the
     * account's usage so far this month
     */
    fetchSelfToken(): Promise<TokenSelf>;
}

export { Event, type EventOrderBy, type EventStream, Identity, type IdentityEventType, type IdentityOrderBy, type IdentityParameter, type IdentityStats, Index, type IndexEventType, type IndexOrderBy, type IndexStats, type IndexValueType, Item, type ItemEventType, type ItemOrderBy, type ItemStats, JSONPadError, List, type ListEventType, type ListOrderBy, type ListStats, type OrderDirection, type PaginatedRequest, type PaginatedResponse, ResponseEvent, type ResponseMeta, type SearchResult, type SubscriptionPlan, Token, type TokenPermission, type TokenSelf, type Usage, User, JSONPad as default };
