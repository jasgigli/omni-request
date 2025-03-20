import { Plugin } from "../../core/plugin/pluginManager";
import { openDB, IDBPDatabase } from 'idb';

export class OfflineSyncPlugin implements Plugin {
  name = "offlineSync";
  enabled = true;
  private db?: IDBPDatabase;
  private syncQueue: Map<string, QueuedRequest> = new Map();
  private isOnline = true;

  constructor(options: OfflineSyncOptions = {}) {
    this.initializeDB();
    this.setupNetworkListeners();
  }

  private async initializeDB() {
    this.db = await openDB('omnirequest-offline', 1, {
      upgrade(db) {
        db.createObjectStore('requests', { keyPath: 'id' });
        db.createObjectStore('responses', { keyPath: 'url' });
      }
    });
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (!this.isOnline) {
      // Store request for later
      const queuedRequest = {
        id: crypto.randomUUID(),
        config,
        timestamp: Date.now()
      };
      
      await this.db?.put('requests', queuedRequest);
      this.syncQueue.set(queuedRequest.id, queuedRequest);
      
      // Return cached response if available
      const cached = await this.db?.get('responses', config.url);
      if (cached) return cached;
      
      throw new Error('Offline: Request queued for sync');
    }
    return config;
  }

  async onResponse(response: ResponseData): Promise<ResponseData> {
    // Cache successful responses
    if (response.status === 200) {
      await this.db?.put('responses', {
        url: response.config.url,
        data: response.data,
        timestamp: Date.now()
      });
    }
    return response;
  }

  private async syncQueuedRequests() {
    if (!this.isOnline) return;

    for (const [id, request] of this.syncQueue) {
      try {
        await this.client.request(request.config);
        await this.db?.delete('requests', id);
        this.syncQueue.delete(id);
      } catch (error) {
        console.error(`Sync failed for request ${id}:`, error);
      }
    }
  }

  private setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueuedRequests();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }
}