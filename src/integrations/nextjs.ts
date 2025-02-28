// src/integrations/nextjs.ts
import { RequestClient } from "../core/requestClient";
import { RequestConfig } from "../types/request";

export async function fetchServerSideData<T = any>(config: RequestConfig): Promise<T> {
  // Create a new instance directly
  const client = new RequestClient({ timeout: 60000 });
  const response = await client.request<T>(config);
  return response.data;
}
