// src/adapters/bunAdapter.ts
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
// Bun has a native fetch, so we can delegate to the browser adapter.
import { browserAdapter } from "./browserAdapter";

export async function bunAdapter(config: RequestConfig): Promise<ResponseData> {
  return await browserAdapter(config);
}
