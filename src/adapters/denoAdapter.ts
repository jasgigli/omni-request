// src/adapters/denoAdapter.ts
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
// Deno supports fetch natively.
import { browserAdapter } from "./browserAdapter";

export async function denoAdapter(config: RequestConfig): Promise<ResponseData> {
  return await browserAdapter(config);
}
