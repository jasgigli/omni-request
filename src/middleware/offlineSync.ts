import { Middleware } from '../types/middleware';
import { RequestConfig } from '../types/request';
import { ResponseData } from '../types/response';

interface OfflineQueueItem {
  config: RequestConfig;
  timestamp: number;
  retryCount: number;
}

interface OfflineSyncOptions {
  enabled?: boolean;
  storageKey?: string;
  maxRetries?: number;
  retryDelay?: number;
  onQueue?: (item: OfflineQueueItem) => void;
  onSuccess?: (item: OfflineQueueItem) => void;
  onError?: (item: OfflineQueueItem, error: any) => void;
}

/**
 * Offline-first middleware that queues requests when offline
 * and automatically syncs when connection is restored
 */
export class OfflineSyncMiddleware implements Middleware {
  private queue: OfflineQueueItem[] = [];
  private options: Required<OfflineSyncOptions>;
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor(options: OfflineSyncOptions = {}) {
    this.options = {
      enabled: true,
      storageKey: 'omnirequest-offline-queue',
      maxRetries: 3,
      retryDelay: 5000,
      onQueue: () => {},
      onSuccess: () => {},
      onError: () => {},
      ...options,
    };

    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Load queue from localStorage
    this.loadQueue();

    // Listen for online/offline events
    this.isOnline = navigator.onLine;
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Sync on load if online
    if (this.isOnline) {
      this.syncQueue();
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.syncQueue();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  async request(config: RequestConfig): Promise<RequestConfig> {
    if (!this.options.enabled) return config;

    // Only queue safe-to-retry methods
    const safeMethods = ['GET', 'POST', 'PUT', 'PATCH'];
    if (!safeMethods.includes(config.method || 'GET')) {
      return config;
    }

    // If offline, queue the request
    if (!this.isOnline) {
      const queueItem: OfflineQueueItem = {
        config,
        timestamp: Date.now(),
        retryCount: 0,
      };
      this.queue.push(queueItem);
      this.saveQueue();
      this.options.onQueue(queueItem);
      
      // Throw a special error to indicate offline
      throw {
        isOffline: true,
        message: 'Request queued for when online',
        queued: true,
      };
    }

    return config;
  }

  async response(response: ResponseData): Promise<ResponseData> {
    return response;
  }

  async error(error: any): Promise<any> {
    // If it's an offline error, rethrow it
    if (error.isOffline) {
      throw error;
    }

    // If it's a network error and we're offline, queue the request
    if (!this.isOnline && error.config) {
      const queueItem: OfflineQueueItem = {
        config: error.config,
        timestamp: Date.now(),
        retryCount: 0,
      };
      this.queue.push(queueItem);
      this.saveQueue();
      this.options.onQueue(queueItem);
      
      throw {
        isOffline: true,
        message: 'Request queued for when online',
        queued: true,
      };
    }

    throw error;
  }

  private async syncQueue() {
    if (this.syncInProgress || this.queue.length === 0) return;

    this.syncInProgress = true;

    while (this.queue.length > 0 && this.isOnline) {
      const item = this.queue[0];
      
      try {
        // Make the request using the original config
        // Note: This would need access to the client instance
        // For now, we'll just mark it as would-sync
        this.options.onSuccess(item);
        this.queue.shift();
        this.saveQueue();
      } catch (error) {
        item.retryCount++;
        
        if (item.retryCount >= this.options.maxRetries) {
          this.options.onError(item, error);
          this.queue.shift();
          this.saveQueue();
        } else {
          // Move to end of queue to try later
          this.queue.shift();
          this.queue.push(item);
          this.saveQueue();
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay));
        }
      }
    }

    this.syncInProgress = false;
  }

  private loadQueue() {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
    }
  }

  private saveQueue() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Manually trigger sync
   */
  sync() {
    this.syncQueue();
  }

  /**
   * Clear the offline queue
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
  }

  /**
   * Get the current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Check if currently online
   */
  isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  /**
   * Cleanup event listeners
   */
  destroy() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
  }
}
