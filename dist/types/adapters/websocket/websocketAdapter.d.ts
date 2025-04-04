import { EventEmitter } from '../../utils/eventEmitter';
export interface WebSocketOptions {
    reconnect?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}
export declare class WebSocketClient extends EventEmitter {
    private url;
    private options;
    private ws;
    private retryCount;
    private reconnectTimer;
    constructor(url: string, options?: WebSocketOptions);
    connect(): void;
    private setupEventHandlers;
    private scheduleReconnect;
    send(data: any): void;
    close(): void;
}
