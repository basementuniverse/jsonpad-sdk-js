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
    /**
     * The item's ETag, on a response that carries one (fetching or writing an
     * item). Send it back as `ifMatch` to write only if the item hasn't
     * changed since
     */
    etag?: string | null;
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
    /**
     * Structured information about the error, when the API sends any: the
     * diagnostics for write rules that don't compile, the tests that failed,
     * or the rule that refused a write
     */
    readonly details: Record<string, any> | null;
    constructor(status: number, body: string, meta: ResponseMeta);
    /**
     * How many seconds to wait before retrying, when the API says: on a 429
     * response, or a 409 INDEX_BUILDING response for an index that is still
     * being built
     */
    get retryAfter(): number | null;
}

/**
 * Thrown when an endpoint flow fails: a require node refused, an item it
 * needed wasn't found, or a write it made was refused. Nothing the run wrote
 * was kept
 *
 * `status` is the status the flow failed with (a require node's chosen
 * status, for example), and `message` is its message
 */
declare class FlowError extends JSONPadError {
    /**
     * Why the run failed, e.g. REQUIRE_FAILED, NOT_FOUND, TIMEOUT
     */
    readonly flowCode: string | null;
    /**
     * The node the run failed at, if it failed at one
     */
    readonly node: string | null;
    /**
     * The run's id, as shown in the flow's run log in the dashboard
     */
    readonly runId: string | null;
    constructor(status: number, body: string, meta: ResponseMeta, runId?: string | null);
    /**
     * The message the flow failed with (JSONPadError's `message` is the raw
     * response body)
     */
    get flowMessage(): string;
}

type EventOrderBy = 'createdAt' | 'type';

type EventStream = 'list' | 'item' | 'index';

type IdentityParameter = {
    ignore?: boolean;
    group?: string;
    token: string;
};

type FlowMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type RunFlowOptions = {
    /**
     * The flow's HTTP method. Defaults to POST. A GET flow is given its input
     * as query parameters, so every value arrives as a string
     */
    method?: FlowMethod;
    /**
     * Run as an identity (the token needs the run-with-identity permission),
     * or `{ ignore: true }` to run without the identity the SDK is signed in as
     */
    identity?: IdentityParameter;
};
type RunPublicFlowOptions = {
    /**
     * The flow's HTTP method. Defaults to POST
     */
    method?: FlowMethod;
};
/**
 * What an endpoint flow responded with
 */
type FlowResponse<T = any> = {
    /**
     * The status the flow's respond node chose (204 if it has none)
     */
    status: number;
    /**
     * The response body, or null for a response with no body
     */
    body: T | null;
    /**
     * Headers the flow's respond node set
     */
    headers: Record<string, string>;
    /**
     * The run's id, as shown in the flow's run log in the dashboard
     */
    runId: string | null;
    meta: ResponseMeta;
};

type IdentityEventType = 'identity-created' | 'identity-updated' | 'identity-deleted' | 'identity-registered' | 'identity-logged-in' | 'identity-logged-out' | 'identity-updated-self' | 'identity-deleted-self' | 'identity-sessions-revoked' | 'identity-password-reset-requested' | 'identity-password-reset' | 'identity-email-verification-requested' | 'identity-email-verified' | 'identity-provider-linked' | 'identity-provider-unlinked';

/**
 * A sign-in provider enabled for an identity group
 */
type IdentityOAuthProvider = {
    /**
     * The provider's id, e.g. 'google'
     */
    provider: string;
    /**
     * The provider's name, e.g. 'Google', for showing on a button
     */
    name: string;
};
/**
 * A provider account linked to an identity
 */
type IdentityProviderAccount = {
    provider: string;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
    createdAt: Date;
    lastLoginAt: Date | null;
};
/**
 * Where the SDK keeps the client verifier between starting and completing a
 * sign-in. Defaults to `sessionStorage`
 */
type IdentityOAuthStorage = {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
};
type StartIdentityOAuthOptions = {
    /**
     * The page the person comes back to after signing in, which calls
     * `completeIdentityOAuth()`. It must be one of the identity group's
     * redirect URLs
     */
    redirectUrl: string;
    /**
     * Go to the provider straight away (the default). Set this to false to get
     * the provider's URL and go there yourself
     */
    navigate?: boolean;
    /**
     * Somewhere other than `sessionStorage` to keep the client verifier
     */
    storage?: IdentityOAuthStorage;
};
type CompleteIdentityOAuthOptions = {
    /**
     * The return page's URL, including the parameters the provider added.
     * Defaults to the current page's URL
     */
    url?: string;
    /**
     * Remove the sign-in parameters from the address bar afterwards (the
     * default), so they don't stay in the browser's history
     */
    cleanUrl?: boolean;
    /**
     * The storage passed to `startIdentityOAuth()`, if it wasn't
     * `sessionStorage`
     */
    storage?: IdentityOAuthStorage;
};

type IdentityOrderBy = 'createdAt' | 'updatedAt' | 'name' | 'displayName' | 'group' | 'activated';

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

/**
 * Choose the identity to request a password reset or email verification token
 * for: exactly one of identityId, name or email, in the (optional) group
 */
type IdentityTokenRequest = {
    group?: string;
} & ({
    identityId: string;
    name?: never;
    email?: never;
} | {
    name: string;
    identityId?: never;
    email?: never;
} | {
    email: string;
    identityId?: never;
    name?: never;
});
/**
 * The response to a password reset or email verification token request
 *
 * If the identity group delivers tokens to a webhook, the token is sent there
 * instead and the response only says so
 */
type IdentityTokenRequestResult<TokenKey extends 'resetToken' | 'verificationToken', IdentityType> = ({
    delivery?: undefined;
    expiresAt: Date | null;
    identity: IdentityType | null;
} & {
    [key in TokenKey]: string | null;
}) | {
    delivery: 'webhook';
};

type IndexBuildStatus = 'ready' | 'building' | 'failed';

type IndexEventType = 'index-created' | 'index-updated' | 'index-deleted' | 'index-built' | 'index-build-failed' | 'index-build-requested';

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

/**
 * An index in a schema sync document. Fields that are left out are left as
 * they are
 */
type SyncSchemaIndexDefinition = {
    name?: string;
    description?: string;
    tags?: string[];
    /**
     * Required when the index is created
     */
    pointer?: string;
    valueType?: IndexValueType;
    alias?: boolean;
    sorting?: boolean;
    filtering?: boolean;
    searching?: boolean;
    guard?: boolean;
    defaultOrderDirection?: OrderDirection;
};
/**
 * A list in a schema sync document. Fields that are left out are left as they
 * are
 */
type SyncSchemaListDefinition = {
    name?: string;
    description?: string;
    tags?: string[];
    schema?: Record<string, any> | null;
    /**
     * The list's write rules: the text, an array of lines (JSON has no
     * multi-line strings), or null for no rules
     */
    rules?: string | string[] | null;
    /**
     * The tests the write rules have to pass
     */
    rulesTests?: Record<string, any> | null;
    /**
     * A file holding the rules, relative to the document. Resolved by the
     * JSONPad CLI: the API refuses a document that still has it
     */
    rulesFile?: string;
    /**
     * A file holding the rule tests, resolved by the CLI like rulesFile
     */
    rulesTestsFile?: string;
    readonly?: boolean;
    realtime?: boolean;
    protected?: boolean;
    indexable?: boolean;
    generative?: boolean;
    generativePrompt?: string | null;
    /**
     * Indexes, keyed by path name
     */
    indexes?: Record<string, SyncSchemaIndexDefinition>;
};
/**
 * A description of lists and their indexes, applied with syncSchema
 */
type SyncSchemaDocument = {
    $schema?: string;
    /**
     * The scope this document manages, e.g. the name of the app its lists
     * belong to
     */
    scope?: string;
    /**
     * Lists, keyed by path name
     */
    lists: Record<string, SyncSchemaListDefinition>;
    /**
     * Flows, keyed by name. Leave this out and the sync doesn't touch flows
     * (and a prune doesn't delete any). Syncing flows needs a token that is
     * allowed everything
     */
    flows?: Record<string, SyncSchemaFlowDefinition>;
};
/**
 * A flow in a schema sync document
 */
type SyncSchemaFlowDefinition = {
    /**
     * The flow document. Its name can be left out: it's the key. Its layout
     * is only used when the flow is created
     */
    document: Record<string, any>;
    /**
     * The flow's stored tests, which must pass, or null for none. Left out,
     * they're left as they are
     */
    tests?: Record<string, any> | null;
    /**
     * Left out, a new flow is activated and an existing one is left as it is
     */
    activated?: boolean;
};
type SyncSchemaAction = 'create' | 'update' | 'adopt' | 'delete' | 'no-change' | 'error';
type SyncSchemaError = {
    name: string;
    code: number;
    message: string;
    /**
     * Structured information about the error, e.g. the diagnostics for write
     * rules that don't compile, or the rule tests that failed
     */
    details?: Record<string, any>;
};
type SyncSchemaChange = {
    resourceType: 'list' | 'index' | 'flow';
    /**
     * The list's path name, for list and index changes
     */
    list?: string;
    /**
     * The index's path name, for index changes
     */
    index?: string;
    listId?: string;
    indexId?: string;
    /**
     * The flow's name and id, for flow changes
     */
    flow?: string;
    flowId?: string;
    action: SyncSchemaAction;
    fields?: Record<string, {
        from: any;
        to: any;
    }>;
    build?: {
        reason: 'created' | 'pointerChanged';
        items: number;
        requiresConfirmation: boolean;
        buildStatus?: IndexBuildStatus;
    };
    /**
     * For a resource a prune deletes
     */
    delete?: {
        /**
         * How many items are deleted with a list
         */
        items?: number;
        /**
         * How many indexes are deleted with a list
         */
        indexes?: number;
        /**
         * Whether the delete needs allowDestructive: a list that has items, or a
         * guard index
         */
        destructive: boolean;
    };
    warnings?: string[];
    errors?: SyncSchemaError[];
};
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
    /**
     * Why the sync wasn't applied (or, in a dry run, wouldn't be)
     */
    blockedBy: SyncSchemaError | null;
};
type SyncSchemaOptions = {
    /**
     * Return the plan without changing anything
     */
    dryRun?: boolean;
    /**
     * Allow changes that rebuild an index in a list that has items, which makes
     * the index unusable until the rebuild finishes
     */
    allowRebuild?: boolean;
    /**
     * Also delete the lists and indexes the document's scope manages that it no
     * longer declares. Needs a scope
     */
    prune?: boolean;
    /**
     * Allow a prune to delete lists that have items, and guard indexes
     */
    allowDestructive?: boolean;
};
type ExportSchemaOptions = {
    /**
     * Only lists managed by this scope
     */
    scope?: string;
    /**
     * Only lists with these tags. A string can contain comma-separated tags
     * (any of them), and an array requires a match for every element
     */
    tagged?: string | string[];
    /**
     * Only lists with these path names
     */
    lists?: string[];
};
type SyncSchemaExport = {
    document: SyncSchemaDocument & {
        $schema: string;
    };
    warnings: string[];
};
/**
 * The lists to move: either lists by id or path name, or every list a scope
 * manages
 */
type MoveListsSelection = {
    lists: string[];
} | {
    fromScope: string;
};
type MoveListsOptions = {
    /**
     * Return the plan without changing anything
     */
    dryRun?: boolean;
};
type MoveListsAction = 'move' | 'assign' | 'release' | 'no-change' | 'error';
type MoveListsChange = {
    /**
     * The list's path name (or id, if it has none), or the requested list if it
     * wasn't found
     */
    list: string;
    listId?: string;
    action: MoveListsAction;
    from?: string | null;
    to?: string | null;
    /**
     * How many of the list's indexes the scope manages, which move (or are
     * released) with the list
     */
    indexes?: number;
    fields?: Record<string, {
        from: any;
        to: any;
    }>;
    warnings?: string[];
    errors?: SyncSchemaError[];
};
type MoveListsResult = {
    moveId: string;
    dryRun: boolean;
    applied: boolean;
    /**
     * The scope the lists were moved to, or null if they were released
     */
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
    /**
     * Why the move wasn't applied (or, in a dry run, wouldn't be)
     */
    blockedBy: SyncSchemaError | null;
};

type TokenPermission = {
    mode: 'allow' | 'block';
    action: '*' | 'create' | 'view' | 'update' | 'delete' | 'restore' | 'register' | 'authenticate' | 'reset-password' | 'verify-email' | 'create-with-identity' | 'view-with-identity' | 'update-with-identity' | 'delete-with-identity' | 'restore-with-identity' | 'sync-schema' | 'run' | 'run-with-identity';
    resourceType?: 'list' | 'item' | 'index' | 'identity' | 'event' | 'stats' | 'flow';
    listIds?: string[];
    itemIds?: string[];
    indexIds?: string[];
    identityIds?: string[];
    groups?: string[];
    /**
     * For the run and run-with-identity actions: the flows the token can run
     */
    flowIds?: string[];
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

/**
 * A problem with some write rules, from the checker
 */
type WriteRuleDiagnostic = {
    severity: 'error' | 'warning';
    /**
     * A stable identifier for the kind of problem, e.g. "unknown-name"
     */
    code: string;
    message: string;
    /**
     * Where in the rule text the problem is. Lines and columns start at 1
     */
    span: {
        start: number;
        end: number;
        line: number;
        column: number;
        endLine: number;
        endColumn: number;
    };
};
/**
 * A candidate write to check against a list's rules, without making it
 */
type TestWriteRulesRequest = {
    /**
     * The rules to test. Defaults to the list's stored rules
     */
    rules?: string | null;
    /**
     * What the write does. A restore is checked with the update rules
     */
    action: 'create' | 'update' | 'delete' | 'restore';
    /**
     * An item to take the old data and metadata from
     */
    itemId?: string;
    /**
     * The item's data before the write. Defaults to the item's, when itemId is
     * given
     */
    old?: any;
    /**
     * The item's data after the write
     */
    new?: any;
    /**
     * A JSON Patch applied to the old data to make the new data
     */
    patch?: {
        op: string;
        path: string;
        from?: string;
        value?: any;
    }[];
    /**
     * A JSON merge patch applied to the old data to make the new data
     */
    merge?: any;
    /**
     * An identity to make the write as
     */
    identityId?: string;
    /**
     * An identity to make the write as, without it having to exist
     */
    identity?: Record<string, any> | null;
    /**
     * The token to make the write as. Defaults to the calling token
     */
    token?: {
        id: string;
        tags?: string[];
    };
    /**
     * The time of the write, which the rules see as `now`. Defaults to now
     */
    now?: Date | string;
    /**
     * The JSON pointer, for writes to part of an item's data
     */
    pointer?: string | null;
    /**
     * Run $jsonpad-var substitution on the new data first (default true)
     */
    substitute?: boolean;
    /**
     * Check the list's JSON schema between the two stages (default true)
     */
    schema?: boolean;
};
/**
 * One rule statement, as it was evaluated
 */
type WriteRuleStatementResult = {
    index: number;
    kind: 'allow' | 'require';
    label: string | null;
    line: number;
    operations: ('create' | 'update' | 'delete')[];
    /**
     * True only if the statement evaluated to true
     */
    result: boolean;
    /**
     * Why the statement isn't true, if evaluating it raised an error
     */
    error: string | null;
    errorLine: number | null;
    /**
     * Each expression that was evaluated, with its value. Values are only
     * included for the account owner
     */
    trace?: {
        id: number;
        span: WriteRuleDiagnostic['span'];
        value?: any;
        hidden?: true;
        error?: string;
    }[];
    traceTruncated?: boolean;
};
/**
 * What a list's rules would do with a candidate write
 */
type TestWriteRulesResult = {
    allowed: boolean;
    /**
     * Which stage decided: the allow statements, the list's JSON schema, the
     * require statements, or none of them
     */
    stage: 'allow' | 'schema' | 'require' | 'ok';
    /**
     * The status a real write would get
     */
    status: number;
    code: string | null;
    reason: string | null;
    message: string | null;
    /**
     * The statement that refused the write, or the one that allowed it
     */
    statement: {
        index: number;
        kind: 'allow' | 'require';
        label: string | null;
        line: number;
    } | null;
    operation: 'create' | 'update' | 'delete';
    action: TestWriteRulesRequest['action'];
    /**
     * The rules engine's version, and the version of the rules language
     */
    engineVersion: string;
    languageVersion: number;
    /**
     * The checker's warnings about the rules that were tested
     */
    diagnostics: WriteRuleDiagnostic[];
    budget: {
        used: number;
        limit: number;
    };
    statements: WriteRuleStatementResult[];
    /**
     * The data the rules saw, after variable substitution. Only for the
     * account owner
     */
    new?: any;
};
/**
 * A write a list's rules refused
 */
type WriteRuleDenial = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    itemId: string | null;
    identityId: string | null;
    tokenId: string | null;
    operation: 'create' | 'update' | 'delete';
    /**
     * "allow" when no rule allowed the write (403), "require" when it failed a
     * check (400)
     */
    stage: 'allow' | 'require';
    statementIndex: number | null;
    statementLabel: string | null;
    statementLine: number | null;
    reason: string | null;
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
    /**
     * Only included when the account owner fetches an identity, or when an
     * identity fetches itself
     */
    email?: string | null;
    emailVerified?: boolean;
    hasPassword?: boolean;
    /**
     * The number of devices the identity is logged in on; only included when an
     * identity fetches itself
     */
    sessionCount?: number;
    /**
     * The provider accounts linked to the identity; included when the account
     * owner fetches an identity, when an identity fetches itself, and after
     * linking an account
     */
    providers?: IdentityProviderAccount[];
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
    /**
     * Whether the index's values have been built
     *
     * An index is built in the background when it's created and when its pointer
     * changes. Until it's 'ready', requests that depend on its values (filtering,
     * ordering, alias lookups and search) are refused with a 409 INDEX_BUILDING
     * or INDEX_BUILD_FAILED error. Use waitForIndex to wait for it
     */
    buildStatus: IndexBuildStatus;
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
    /**
     * The list's write rules, checked on every item write made with an API
     * token. Only returned to the account owner and to tokens that can update
     * the list
     */
    rules?: string | null;
    /**
     * The tests the write rules have to pass before they're saved
     */
    rulesTests?: Record<string, any> | null;
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

/**
 * Thrown by waitForIndex when an index can't be used: its build failed, or it
 * didn't finish building before the timeout
 */
declare class IndexBuildError extends Error {
    /**
     * Why the index isn't ready
     */
    readonly reason: 'failed' | 'timeout';
    /**
     * The index as it was when we stopped waiting
     */
    readonly index: Index;
    constructor(reason: 'failed' | 'timeout', index: Index);
}

/**
 * Thrown when a list's write rules refuse a write
 *
 * `denied` tells the two cases apart:
 * - the rules didn't authorise the write at all (403). The message is always
 *   the same, on purpose
 * - the write was authorised but failed one of the list's checks (400). The
 *   message is the one the rule's author wrote
 */
declare class WriteRuleError extends JSONPadError {
    /**
     * True when no rule allowed the write (403), false when it failed a check
     * (400)
     */
    readonly denied: boolean;
    /**
     * The operation the rules refused: create, update or delete
     */
    readonly operation: string | null;
    /**
     * The label of the rule that refused the write, if it has one and the API
     * says which
     */
    readonly rule: string | null;
    /**
     * The line the rule starts on
     */
    readonly line: number | null;
    constructor(status: number, body: string, meta: ResponseMeta);
}
/**
 * Thrown when an item has changed since the ETag sent as `ifMatch` (412)
 *
 * Fetch the item again, re-apply the change, and write it again.
 */
declare class PreconditionFailedError extends JSONPadError {
    constructor(status: number, body: string, meta: ResponseMeta);
}
/**
 * Thrown when another write changed the item while this one was being made
 * (409), on a list with write rules
 *
 * The rules were checked against a version of the item that no longer exists,
 * so nothing was written. Fetch the item again and retry.
 */
declare class ConflictError extends JSONPadError {
    constructor(status: number, body: string, meta: ResponseMeta);
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

type JSONPadOptions = {
    /**
     * The API's base URL, e.g. for a local development server. Defaults to
     * https://api.jsonpad.io
     */
    apiUrl?: string;
    /**
     * Sent as the User-Agent header of every request, to identify your app or
     * tool, e.g. 'my-app/1.0'. Browsers may not let scripts set it, in which
     * case it's left out
     */
    userAgent?: string;
};
declare class JSONPad extends EventTarget {
    private token;
    private identityGroup?;
    private identityToken?;
    private lastResponseMeta;
    private apiUrl;
    private userAgent;
    /**
     * Create a new JSONPad client instance
     */
    constructor(token: string, identityGroup?: string | undefined, identityToken?: string | undefined, options?: JSONPadOptions);
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
    /**
     * Add the User-Agent header to a request's headers, if one was configured
     */
    private withUserAgent;
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
     * Check a write against a list's rules, without making it
     *
     * Only for the account owner and for tokens that can update the list
     */
    testListRules(listId: string, write: TestWriteRulesRequest): Promise<TestWriteRulesResult>;
    /**
     * The most recent writes a list's rules refused, newest first
     *
     * Only for the account owner and for tokens that can update the list
     */
    fetchListRuleDenials(listId: string): Promise<WriteRuleDenial[]>;
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
        /**
         * The item's ETag, from the etag header of the response you last read
         * or wrote it with. The restore only happens if the item hasn't changed
         * since, and fails with a PreconditionFailedError (412) if it has
         */
        ifMatch: string;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Update an item
     */
    updateItem(listId: string, itemId: string, data: Partial<Item>, parameters?: Partial<{
        includeData: boolean;
        includeGuarded: boolean;
        /**
         * The item's ETag, from the etag header of the response you last read or
         * wrote it with (`lastResponseMeta.etag`). The write only happens if the
         * item hasn't changed since, and fails with a PreconditionFailedError
         * (412) if it has
         */
        ifMatch: string;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Update an item's data
     */
    updateItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
        /**
         * The item's ETag, from the etag header of the response you last read or
         * wrote it with (`lastResponseMeta.etag`). The write only happens if the
         * item hasn't changed since, and fails with a PreconditionFailedError
         * (412) if it has
         */
        ifMatch: string;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Replace an item's data
     */
    replaceItemData<T = any>(listId: string, itemId: string, data: T, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
        /**
         * The item's ETag, from the etag header of the response you last read or
         * wrote it with (`lastResponseMeta.etag`). The write only happens if the
         * item hasn't changed since, and fails with a PreconditionFailedError
         * (412) if it has
         */
        ifMatch: string;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Patch an item's data
     */
    patchItemData(listId: string, itemId: string, patch: JSONPatch, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
        /**
         * The item's ETag, from the etag header of the response you last read or
         * wrote it with (`lastResponseMeta.etag`). The write only happens if the
         * item hasn't changed since, and fails with a PreconditionFailedError
         * (412) if it has
         */
        ifMatch: string;
    }>, identity?: IdentityParameter): Promise<Item>;
    /**
     * Delete an item
     */
    deleteItem(listId: string, itemId: string, identity?: IdentityParameter, options?: Partial<{
        /**
         * The item's ETag, from the etag header of the response you last read
         * or wrote it with. The delete only happens if the item hasn't changed
         * since, and fails with a PreconditionFailedError (412) if it has
         */
        ifMatch: string;
    }>): Promise<void>;
    /**
     * Delete part of an item's data
     */
    deleteItemData(listId: string, itemId: string, parameters?: Partial<{
        pointer: string;
        includeData: boolean;
        includeGuarded: boolean;
        /**
         * The item's ETag, from the etag header of the response you last read or
         * wrote it with (`lastResponseMeta.etag`). The write only happens if the
         * item hasn't changed since, and fails with a PreconditionFailedError
         * (412) if it has
         */
        ifMatch: string;
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
     * Start a new build for an index whose last build failed
     *
     * Failed builds are never retried automatically, so fix the problem (e.g.
     * items sharing an alias value) and then call this. The index is returned
     * with `buildStatus: 'building'`; use waitForIndex to wait for it. Refused
     * with a 409 INDEX_BUILD_NOT_FAILED error if the index is ready or already
     * being built
     */
    rebuildIndex(listId: string, indexId: string): Promise<Index>;
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
    waitForIndex(listId: string, indexId: string, options?: Partial<{
        timeout: number;
        interval: number;
        maxInterval: number;
    }>): Promise<Index>;
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
        email?: string | null;
        password: string;
        tags?: string[];
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
        group?: string;
        name?: string;
        displayName?: string | null;
        email?: string | null;
        password?: string;
        tags?: string[];
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
        email?: string | null;
        password: string;
    }, identity?: IdentityParameter): Promise<Identity>;
    /**
     * Login using an identity, identified by its name or its email address
     */
    loginIdentity(data: {
        group?: string;
        password: string;
    } & ({
        name: string;
        email?: never;
    } | {
        email: string;
        name?: never;
    }), identity?: IdentityParameter): Promise<[Identity, string | undefined]>;
    /**
     * Logout using an identity
     *
     * By default only the current session ends; set `all` to log the identity
     * out on every device
     */
    logoutIdentity(identity?: IdentityParameter, options?: {
        all?: boolean;
    }): Promise<void>;
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
        email?: string | null;
        password?: string;
        currentPassword?: string;
    }, identity?: IdentityParameter): Promise<Identity>;
    /**
     * Delete the current identity
     */
    deleteSelfIdentity(identity?: IdentityParameter): Promise<void>;
    /**
     * Request a password reset token for an identity
     *
     * If the identity group returns tokens to the caller (the default), the
     * token is in the response: only call this from a server, with a token that
     * never leaves it, then send the reset link to the identity yourself. If the
     * group delivers tokens to a webhook, the token is sent there instead, and
     * this is safe to call from a browser
     */
    requestIdentityPasswordReset(data: IdentityTokenRequest): Promise<IdentityTokenRequestResult<'resetToken', Identity>>;
    /**
     * Set a new password for an identity, using a password reset token
     *
     * This logs the identity out everywhere; it then needs to log in with its
     * new password
     */
    confirmIdentityPasswordReset(data: {
        resetToken: string;
        password: string;
    }): Promise<Identity>;
    /**
     * Request an email verification token for an identity
     *
     * As with password reset tokens, only call this from a server unless the
     * identity group delivers tokens to a webhook
     */
    requestIdentityEmailVerification(data: IdentityTokenRequest): Promise<IdentityTokenRequestResult<'verificationToken', Identity>>;
    /**
     * Verify an identity's email address, using an email verification token
     */
    confirmIdentityEmailVerification(data: {
        verificationToken: string;
    }): Promise<Identity>;
    /**
     * Fetch the sign-in providers enabled for an identity group, e.g. to show a
     * "Sign in with…" button for each one
     */
    fetchIdentityOAuthProviders(group?: string): Promise<IdentityOAuthProvider[]>;
    /**
     * Start signing in with a provider (browser only)
     *
     * This goes to the provider's sign-in page. Afterwards, the person comes
     * back to `redirectUrl`, which should call `completeIdentityOAuth()`
     *
     * If nobody is linked to the provider account yet, completing the sign-in
     * creates a new identity (if the token can register identities)
     */
    startIdentityOAuth(provider: string, options: StartIdentityOAuthOptions & {
        group?: string;
    }): Promise<{
        url: string;
        expiresAt: Date;
    }>;
    /**
     * Finish signing in with a provider (or linking a provider account), on the
     * page the provider sent the person back to (browser only)
     *
     * After signing in, the identity is logged in, as with `loginIdentity()`.
     * `created` is true if a new identity was made for the provider account.
     * After linking an account, `token` is undefined
     */
    completeIdentityOAuth(options?: CompleteIdentityOAuthOptions): Promise<{
        identity: Identity;
        token: string | undefined;
        created: boolean;
    }>;
    /**
     * Start linking a provider account to the current identity (browser only),
     * so the identity can sign in with it
     *
     * The return page completes it with `completeIdentityOAuth()`
     */
    linkSelfIdentityProvider(provider: string, options: StartIdentityOAuthOptions, identity?: IdentityParameter): Promise<{
        url: string;
        expiresAt: Date;
    }>;
    /**
     * Fetch the provider accounts linked to the current identity
     */
    fetchSelfIdentityProviders(identity?: IdentityParameter): Promise<IdentityProviderAccount[]>;
    /**
     * Unlink a provider account from the current identity
     *
     * An identity's last way of signing in can't be removed: set a password
     * first, or link another account
     */
    unlinkSelfIdentityProvider(provider: string, identity?: IdentityParameter): Promise<void>;
    /**
     * Start a sign-in or link; signing in passes `{ ignore: true }`, because
     * an identity that's already logged in can't sign in again
     */
    private startOAuth;
    private requestIdentityToken;
    /**
     * Fetch the current token, the limits of the plan it belongs to, and the
     * account's usage so far this month
     */
    fetchSelfToken(): Promise<TokenSelf>;
    /**
     * Call an endpoint flow, e.g. `runFlow('create-order', { productId })` for
     * a flow at /flows/create-order
     *
     * The token needs the `run` permission on the flow, or `run-with-identity`
     * when the SDK is signed in as an identity (or one is given). The flow
     * runs in one transaction: if it fails (a require node refuses, an item it
     * needs isn't there, a write is refused) nothing it wrote is kept, and a
     * FlowError is thrown with the status and message the flow failed with
     */
    runFlow<T = any>(path: string, input?: Record<string, any> | null, options?: RunFlowOptions): Promise<FlowResponse<T>>;
    /**
     * Call a public endpoint flow by its id. No token is sent: anyone can call
     * a public flow, and its require nodes decide what they may do
     */
    runPublicFlow<T = any>(flowId: string, input?: Record<string, any> | null, options?: RunPublicFlowOptions): Promise<FlowResponse<T>>;
    private sendFlowRequest;
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
    syncSchema(document: SyncSchemaDocument, options?: SyncSchemaOptions): Promise<SyncSchemaResult>;
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
    moveLists(selection: MoveListsSelection, scope: string | null, options?: MoveListsOptions): Promise<MoveListsResult>;
    /**
     * Send a schema sync request whose response is a plan. A refused plan is
     * returned rather than thrown, because it describes why it was refused
     */
    private requestPlan;
    /**
     * Describe existing lists and their indexes as a schema sync document
     */
    exportSchema(options?: ExportSchemaOptions): Promise<SyncSchemaExport>;
}

export { type CompleteIdentityOAuthOptions, ConflictError, Event, type EventOrderBy, type EventStream, type ExportSchemaOptions, FlowError, type FlowMethod, type FlowResponse, Identity, type IdentityEventType, type IdentityOAuthProvider, type IdentityOAuthStorage, type IdentityOrderBy, type IdentityParameter, type IdentityProviderAccount, type IdentityStats, type IdentityTokenRequest, type IdentityTokenRequestResult, Index, IndexBuildError, type IndexBuildStatus, type IndexEventType, type IndexOrderBy, type IndexStats, type IndexValueType, Item, type ItemEventType, type ItemOrderBy, type ItemStats, JSONPadError, type JSONPadOptions, List, type ListEventType, type ListOrderBy, type ListStats, type MoveListsAction, type MoveListsChange, type MoveListsOptions, type MoveListsResult, type MoveListsSelection, type OrderDirection, type PaginatedRequest, type PaginatedResponse, PreconditionFailedError, ResponseEvent, type ResponseMeta, type RunFlowOptions, type RunPublicFlowOptions, type SearchResult, type StartIdentityOAuthOptions, type SubscriptionPlan, type SyncSchemaAction, type SyncSchemaChange, type SyncSchemaDocument, type SyncSchemaError, type SyncSchemaExport, type SyncSchemaFlowDefinition, type SyncSchemaIndexDefinition, type SyncSchemaListDefinition, type SyncSchemaOptions, type SyncSchemaResult, type TestWriteRulesRequest, type TestWriteRulesResult, Token, type TokenPermission, type TokenSelf, type Usage, User, type WriteRuleDenial, type WriteRuleDiagnostic, WriteRuleError, type WriteRuleStatementResult, JSONPad as default };
