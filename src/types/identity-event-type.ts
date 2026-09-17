export type IdentityEventType =
  | 'identity-created'
  | 'identity-updated'
  | 'identity-deleted'
  | 'identity-registered'
  | 'identity-logged-in'
  | 'identity-logged-out'
  | 'identity-updated-self'
  | 'identity-deleted-self'
  | 'identity-sessions-revoked'
  | 'identity-password-reset-requested'
  | 'identity-password-reset'
  | 'identity-email-verification-requested'
  | 'identity-email-verified';
