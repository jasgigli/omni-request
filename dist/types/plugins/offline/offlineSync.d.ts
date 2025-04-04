import { Plugin } from "../../core/plugin/pluginManager";
export declare class OfflineSyncPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private db?;
    private syncQueue;
    private isOnline;
    constructor(options?: OfflineSyncOptions);
    private initializeDB;
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    onResponse(response: ResponseData): Promise<ResponseData>;
    private syncQueuedRequests;
    private setupNetworkListeners;
}
