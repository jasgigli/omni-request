// src/adapters/bunAdapter.ts
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
// For Bun, we assume the global fetch is available. Delegate to the browser adapter.
import { browserAdapter } from "./browserAdapter";

export async function bunAdapter(config: RequestConfig): Promise<ResponseData> {
  return await browserAdapter(config);
}
