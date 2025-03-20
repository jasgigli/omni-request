export interface RequestMetrics {
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  status: number;
  bytesSent?: number;
  bytesReceived?: number;
  cached: boolean;
  retries: number;
}

export class MetricsCollector {
  private metrics: RequestMetrics[] = [];
  private listeners: ((metrics: RequestMetrics) => void)[] = [];

  addMetric(metric: RequestMetrics): void {
    this.metrics.push(metric);
    this.notifyListeners(metric);
  }

  onMetric(callback: (metric: RequestMetrics) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + (m.endTime - m.startTime), 0);
    return total / this.metrics.length;
  }

  getErrorRate(): number {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => m.status >= 400).length;
    return errors / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const hits = this.metrics.filter(m => m.cached).length;
    return hits / this.metrics.length;
  }

  private notifyListeners(metric: RequestMetrics): void {
    this.listeners.forEach(listener => listener(metric));
  }
}