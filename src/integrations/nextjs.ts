// src/integrations/nextjs.ts
import RequestClient from "../core/requestClient";
import { RequestConfig } from "../types/request";

export async function fetchServerSideData<T = any>(config: RequestConfig): Promise<T> {
  const client = RequestClient.create({ timeout: 60000 });
  const response = await client.request<T>(config);
  return response.data;
}
