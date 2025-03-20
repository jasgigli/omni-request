import { useState, useEffect, useRef } from 'react';
import { RequestClient } from '../../core/requestClient';
import { SubscriptionOptions, RealtimeData } from '../../types/subscription';

export function useSubscription<T>(
  client: RequestClient,
  endpoint: string,
  options: SubscriptionOptions = {}
): {
  data: T | null;
  error: Error | null;
  isConnected: boolean;
  reconnect: () => void;
} {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = () => {
    const protocol = options.secure ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${endpoint}`);

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      
      // Send authentication if provided
      if (options.auth) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: options.auth.token
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const message: RealtimeData<T> = JSON.parse(event.data);
        
        if (message.type === 'data') {
          setData(message.payload);
          options.onData?.(message.payload);
        } else if (message.type === 'error') {
          setError(new Error(message.message));
          options.onError?.(new Error(message.message));
        }
      } catch (e) {
        setError(e as Error);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      if (options.autoReconnect) {
        setTimeout(connect, options.reconnectDelay || 3000);
      }
    };

    ws.onerror = (event) => {
      setError(new Error('WebSocket error'));
      options.onError?.(new Error('WebSocket error'));
    };

    wsRef.current = ws;
  };

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [endpoint]);

  const reconnect = () => {
    wsRef.current?.close();
    connect();
  };

  return { data, error, isConnected, reconnect };
}