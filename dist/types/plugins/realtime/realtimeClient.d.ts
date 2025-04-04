import { Plugin } from "../../core/plugin/pluginManager";
export declare class RealtimePlugin implements Plugin {
    name: string;
    enabled: boolean;
    private connections;
    private options;
    constructor(options?: RealtimeOptions);
    createWebSocket(url: string, options?: WebSocketOptions): Promise<WebSocket>;
    createSSE(url: string, options?: SSEOptions): Promise<EventSource>;
    private handleReconnect;
}
