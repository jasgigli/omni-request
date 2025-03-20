export function buildURL(url: string, params?: Record<string, any>): string {
  if (!params) return url;

  const parts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && typeof value !== 'undefined') {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });

  if (parts.length === 0) return url;

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}${parts.join('&')}`;
}