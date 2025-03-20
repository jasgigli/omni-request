import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import { browserAdapter } from "./browserAdapter";

export function bunAdapter(config: RequestConfig): Promise<ResponseData> {
  return browserAdapter(config);
}
