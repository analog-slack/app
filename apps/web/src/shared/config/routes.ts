export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  WORKSPACE: (id: string) => `/profile/workspaces/${encodeURIComponent(id)}`,
} as const;

const LOCAL_ORIGIN = 'https://analog-slack.invalid';

export function getSafeReturnTo(value?: string | null) {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\s]/.test(value)) {
    return ROUTES.PROFILE;
  }
  const url = new URL(value, LOCAL_ORIGIN);
  if (
    url.origin !== LOCAL_ORIGIN ||
    /^\/(?:\/|%2f|%5c)/i.test(url.pathname) ||
    [ROUTES.LOGIN, ROUTES.REGISTER].some(
      (path) => url.pathname === path || url.pathname === `${path}/`,
    )
  ) {
    return ROUTES.PROFILE;
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export function withReturnTo(
  path: typeof ROUTES.LOGIN | typeof ROUTES.REGISTER,
  returnTo?: string,
) {
  return returnTo
    ? `${path}?${new URLSearchParams({ returnTo: getSafeReturnTo(returnTo) })}`
    : path;
}
