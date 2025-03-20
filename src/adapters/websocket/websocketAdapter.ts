import { EventEmitter } from '../../utils/eventEmitter';

export interface WebSocketOptions {
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private retryCount = 0;
  private reconnectTimer: any = null;

  constructor(
    private url: string,
    private options: WebSocketOptions = {}
  ) {
    super();
    this.options = {
      reconnect: true,
      maxRetries: 5,
      retryDelay: 1000,
      ...options
    };
  }

  connect() {
    this.ws = new WebSocket(this.url);
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.emit('connect');
    };

    this.ws.onmessage = (event) => {
      this.emit('message', JSON.parse(event.data));
    };

    this.ws.onclose = () => {
      this.emit('disconnect');
      if (this.options.reconnect && this.retryCount < this.options.maxRetries!) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      this.emit('error', error);
    };
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.retryCount++;
      this.connect();
    }, this.options.retryDelay);
  }

  send(data: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(data));
  }

  close() {
    if (this.ws) {
      this.options.reconnect = false;
      this.ws.close();
    }
  }
}