import { browserAdapter } from "./browserAdapter";
import { nodeAdapter } from "./nodeAdapter";
import { bunAdapter } from "./bunAdapter";
import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";

export type AdapterFunction = (config: RequestConfig) => Promise<ResponseData>;

export function getAdapter(): AdapterFunction {
  // Check for Deno environment
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    return browserAdapter; // Deno uses browser-compatible fetch
  }

  // Check for Bun environment
  if (typeof globalThis !== "undefined" && "Bun" in globalThis) {
    return bunAdapter;
  }

  // Check for browser environment
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return browserAdapter;
  }

  // Check for Node.js environment
  if (
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.node
  ) {
    return nodeAdapter;
  }

  // Default to browser adapter
  return browserAdapter;
}
