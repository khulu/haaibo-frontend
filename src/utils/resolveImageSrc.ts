export function resolveImageSrc(p?: string) {
  const isProd = (import.meta.env as unknown as Record<string, unknown>).ASPNETCORE_ENVIRONMENT === 'Production' || import.meta.env.PROD;
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/api\/?$/, '');
  const path = p ?? '';
  if (!path) return undefined;
  if (!isProd) return path;
  if (/^https?:\/\//.test(path)) return path;
  return baseUrl ? `${baseUrl}${path}` : path;
}
