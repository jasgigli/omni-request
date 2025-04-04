import { IncomingHttpHeaders } from "http";

export function normalizeHeaders(
  headers: IncomingHttpHeaders
): Record<string, string | string[] | undefined> {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );
}
