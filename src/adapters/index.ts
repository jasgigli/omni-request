import { browserAdapter } from "./browserAdapter";
import { nodeAdapter } from "./nodeAdapter";
import { denoAdapter } from "./denoAdapter";
import type { RequestConfig } from "../types/request";

export function selectAdapter() {
  if (typeof window !== "undefined" && window.fetch) {
    return browserAdapter;
  }

  if (typeof Deno !== "undefined") {
    return denoAdapter;
  }

  if (
    typeof process !== "undefined" &&
    process.versions &&
    process.versions.node
  ) {
    return nodeAdapter;
  }

  return browserAdapter; // Default to browser adapter
}

export const getAdapter = selectAdapter;

export type RequestAdapter = (config: RequestConfig) => Promise<any>;
