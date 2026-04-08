import { createInternalNeonAuth } from '@neondatabase/auth';
import { BetterAuthReactAdapter } from '@neondatabase/auth/react/adapters';

const neonAuthUrl = import.meta.env.VITE_NEON_AUTH_URL;

export const neonAuth = neonAuthUrl
  ? createInternalNeonAuth(neonAuthUrl, {
      adapter: BetterAuthReactAdapter(),
    })
  : null;

export const neonAuthClient = neonAuth?.adapter ?? null;

export const getNeonJwtToken = async () => {
  if (!neonAuth) {
    return null;
  }

  return neonAuth.getJWTToken();
};