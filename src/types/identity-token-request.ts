/**
 * Choose the identity to request a password reset or email verification token
 * for: exactly one of identityId, name or email, in the (optional) group
 */
export type IdentityTokenRequest = {
  group?: string;
} & (
  | { identityId: string; name?: never; email?: never }
  | { name: string; identityId?: never; email?: never }
  | { email: string; identityId?: never; name?: never }
);

/**
 * The response to a password reset or email verification token request
 *
 * If the identity group delivers tokens to a webhook, the token is sent there
 * instead and the response only says so
 */
export type IdentityTokenRequestResult<
  TokenKey extends 'resetToken' | 'verificationToken',
  IdentityType,
> =
  | ({
      delivery?: undefined;
      expiresAt: Date | null;
      identity: IdentityType | null;
    } & { [key in TokenKey]: string | null })
  | {
      delivery: 'webhook';
    };
