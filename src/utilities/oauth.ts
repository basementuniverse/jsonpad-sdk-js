import { IdentityOAuthStorage } from '../types/identity-oauth';

const STORAGE_KEY_PREFIX = 'jsonpad-oauth:';

/**
 * The parameters a provider (or JSONPad's callback) adds to the return page
 */
export const CALLBACK_PARAMS = [
  'code',
  'state',
  'error',
  'error_description',
  'user',
];

function getCrypto(): Crypto {
  const crypto = (globalThis as any).crypto as Crypto | undefined;

  if (!crypto?.subtle || !crypto.getRandomValues) {
    throw new Error(
      'Signing in with a provider needs the Web Crypto API, which is available in browsers and recent versions of Node'
    );
  }

  return crypto;
}

function base64url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach(byte => (binary += String.fromCharCode(byte)));

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Make a random client verifier, and the hash of it that's sent to JSONPad
 */
export async function createClientVerifier(): Promise<[string, string]> {
  const crypto = getCrypto();
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(verifier)
  );
  const hash = Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');

  return [verifier, hash];
}

/**
 * Get the storage for client verifiers, or throw if there isn't any
 */
export function getStorage(
  storage?: IdentityOAuthStorage
): IdentityOAuthStorage {
  if (storage) {
    return storage;
  }

  try {
    const sessionStorage = (globalThis as any).sessionStorage;

    if (sessionStorage) {
      return sessionStorage;
    }
  } catch {}

  throw new Error(
    'Signing in with a provider needs sessionStorage; outside a browser, pass a storage option'
  );
}

export function storageKey(state: string): string {
  return `${STORAGE_KEY_PREFIX}${state}`;
}

/**
 * Remove the sign-in parameters from the address bar, if the page is the one
 * that was completed
 */
export function cleanCurrentUrl(url: string) {
  const location = (globalThis as any).location as Location | undefined;
  const history = (globalThis as any).history as History | undefined;

  if (!location || !history?.replaceState || location.href !== url) {
    return;
  }

  const cleaned = new URL(url);
  CALLBACK_PARAMS.forEach(key => cleaned.searchParams.delete(key));
  history.replaceState(history.state, '', cleaned.toString());
}
