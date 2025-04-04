import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
export interface Adapter {
    request<T = any>(config: RequestConfig): Promise<ResponseData<T>>;
}
