import { Plugin } from "../../core/plugin/pluginManager";
export declare class SecurityEnhancerPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    constructor(options: SecurityOptions);
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    private signRequest;
    private encryptRequest;
}
