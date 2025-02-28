// src/adapters/index.ts
import { browserAdapter } from "./browserAdapter";
import { nodeAdapter } from "./nodeAdapter";
import { bunAdapter } from "./bunAdapter";
import { denoAdapter } from "./denoAdapter";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";

export type AdapterFunction = (config: RequestConfig) => Promise<ResponseData>;

export function getAdapter(): AdapterFunction {
  if (typeof Deno !== "undefined" && typeof Deno.version !== "undefined") {
    return denoAdapter;
  }
  if (typeof Bun !== "undefined") {
    return bunAdapter;
  }
  if (typeof window !== "undefined" && typeof fetch !== "undefined") {
    return browserAdapter;
  }
  if (typeof process !== "undefined" && process.versions && process.versions.node) {
    return nodeAdapter;
  }
  return browserAdapter;
}
