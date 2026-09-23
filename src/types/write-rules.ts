/**
 * A problem with some write rules, from the checker
 */
export type WriteRuleDiagnostic = {
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
export type TestWriteRulesRequest = {
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
  patch?: { op: string; path: string; from?: string; value?: any }[];

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
  token?: { id: string; tags?: string[] };

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
export type WriteRuleStatementResult = {
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
export type TestWriteRulesResult = {
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
  budget: { used: number; limit: number };
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
export type WriteRuleDenial = {
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
