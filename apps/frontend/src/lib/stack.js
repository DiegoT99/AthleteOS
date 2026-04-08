import { StackClientApp } from '@stackframe/stack';

const hasStackConfig =
  Boolean(import.meta.env.VITE_STACK_PROJECT_ID) &&
  Boolean(import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY);

export const stackApp = hasStackConfig
  ? new StackClientApp({
      projectId: import.meta.env.VITE_STACK_PROJECT_ID,
      publishableClientKey: import.meta.env.VITE_STACK_PUBLISHABLE_CLIENT_KEY,
      tokenStore: 'cookie',
    })
  : null;

export const getStackAuthHeaders = async () => {
  if (!stackApp) {
    return {};
  }
  return stackApp.getAuthHeaders();
};