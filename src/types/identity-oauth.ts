/**
 * A sign-in provider enabled for an identity group
 */
export type IdentityOAuthProvider = {
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
export type IdentityProviderAccount = {
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
export type IdentityOAuthStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type StartIdentityOAuthOptions = {
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

export type CompleteIdentityOAuthOptions = {
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
