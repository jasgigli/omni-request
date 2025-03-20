import { Plugin } from "../../core/plugin/pluginManager";

export class RealtimePlugin implements Plugin {
  name = "realtime";
  enabled = true;
  private connections = new Map<string, Connection>();
  private options: RealtimeOptions;

  constructor(options: RealtimeOptions = {}) {
    this.options = {
      reconnectAttempts: 3,
      reconnectDelay: 1000,
      ...options
    };
  }

  async createWebSocket(url: string, options: WebSocketOptions = {}): Promise<WebSocket> {
    const ws = new WebSocket(url);
    
    const connection: Connection = {
      type: 'websocket',
      instance: ws,
      status: 'connecting',
      attempts: 0
    };

    ws.onopen = () => {
      connection.status = 'connected';
      options.onOpen?.();
    };

    ws.onmessage = (event) => {
      options.onMessage?.(JSON.parse(event.data));
    };

    ws.onclose = () => {
      connection.status = 'disconnected';
      this.handleReconnect(connection, url, options);
    };

    this.connections.set(url, connection);
    return ws;
  }

  async createSSE(url: string, options: SSEOptions = {}): Promise<EventSource> {
    const sse = new EventSource(url);
    
    const connection: Connection = {
      type: 'sse',
      instance: sse,
      status: 'connecting',
      attempts: 0
    };

    sse.onopen = () => {
      connection.status = 'connected';
      options.onOpen?.();
    };

    sse.onmessage = (event) => {
      options.onMessage?.(JSON.parse(event.data));
    };

    sse.onerror = () => {
      connection.status = 'disconnected';
      this.handleReconnect(connection, url, options);
    };

    this.connections.set(url, connection);
    return sse;
  }

  private async handleReconnect(
    connection: Connection,
    url: string,
    options: RealtimeOptions
  ) {
    if (connection.attempts >= this.options.reconnectAttempts!) {
      return;
    }

    connection.attempts++;
    
    setTimeout(() => {
      if (connection.type === 'websocket') {
        this.createWebSocket(url, options);
      } else {
        this.createSSE(url, options);
      }
    }, this.options.reconnectDelay! * connection.attempts);
  }
}