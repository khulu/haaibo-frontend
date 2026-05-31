export function resolveImageSrc(p?: string) {
  const path = p ?? '';
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  // In dev, relative paths are served from the backend via proxy or direct
  // Ensure path starts with / for proper resolution
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const isProd = (import.meta.env as unknown as Record<string, unknown>).ASPNETCORE_ENVIRONMENT === 'Production' || import.meta.env.PROD;
  if (isProd) {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
    return baseUrl ? `${baseUrl}${normalized}` : normalized;
  }
  return normalized;
}
