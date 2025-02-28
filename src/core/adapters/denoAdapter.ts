// src/adapters/denoAdapter.ts
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
// In Deno, fetch is built‑in. Delegate to the browser adapter.
import { browserAdapter } from "./browserAdapter";

export async function denoAdapter(config: RequestConfig): Promise<ResponseData> {
  return await browserAdapter(config);
}
