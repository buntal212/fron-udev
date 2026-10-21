export function hasAdminSession(token, user) {
  return Boolean(token && user?.id && user?.username)
}

export function isAdminSessionRejected(error) {
  return [401, 403].includes(error?.response?.status)
}

export function getSafePostLoginRedirect(redirect) {
  if (
    typeof redirect === 'string' &&
    redirect.startsWith('/') &&
    !redirect.startsWith('//')
  ) {
    return redirect
  }

  return '/'
}
