import { StackServerApp } from '@stackframe/stack';

const hasStackConfig =
  Boolean(process.env.STACK_PROJECT_ID) &&
  Boolean(process.env.STACK_SECRET_SERVER_KEY) &&
  Boolean(process.env.STACK_PUBLISHABLE_CLIENT_KEY);

export const stackServerApp = hasStackConfig
  ? new StackServerApp({
      projectId: process.env.STACK_PROJECT_ID,
      publishableClientKey: process.env.STACK_PUBLISHABLE_CLIENT_KEY,
      secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
      tokenStore: 'memory',
    })
  : null;

const getHeaderValue = (req, headerName) => {
  const value = req.headers?.[headerName.toLowerCase()];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
};

const toTokenStoreFromRequest = (req) => ({
  headers: {
    get: (name) => getHeaderValue(req, name),
  },
});

export const getStackUserFromRequest = async (req) => {
  if (!stackServerApp) {
    return null;
  }

  const stackHeader = getHeaderValue(req, 'x-stack-auth');
  if (!stackHeader) {
    return null;
  }

  const user = await stackServerApp.getUser({
    tokenStore: toTokenStoreFromRequest(req),
    or: 'return-null',
  });

  return user;
};