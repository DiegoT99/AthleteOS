import { createRemoteJWKSet, jwtVerify } from 'jose';

const normalizeBaseUrl = (url) => {
  if (!url) {
    return null;
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

const getNeonBaseUrl = () =>
  normalizeBaseUrl(process.env.NEON_AUTH_BASE_URL || process.env.VITE_NEON_AUTH_URL);

const getJwksUrl = () => {
  const explicitJwksUrl = process.env.NEON_AUTH_JWKS_URL;
  if (explicitJwksUrl) {
    return explicitJwksUrl;
  }

  const baseUrl = getNeonBaseUrl();
  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/.well-known/jwks.json`;
};

const getIssuer = () => getNeonBaseUrl() || undefined;

let jwks = null;

const getJwks = () => {
  if (!jwks) {
    const jwksUrl = getJwksUrl();
    if (!jwksUrl) {
      throw new Error('NEON_AUTH_BASE_URL is not configured');
    }

    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  return jwks;
};

export const verifyNeonJwt = async (token) => {
  const issuer = getIssuer();
  const options = {
    issuer,
  };

  const { payload } = await jwtVerify(token, getJwks(), options);
  return payload;
};

export const getBearerToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
};