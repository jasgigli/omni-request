import { MetricsOptions, RequestMetrics } from "../types/metrics";

export class PerformanceMetrics {
  private metrics: Map<string, RequestMetrics> = new Map();
  private options: Required<MetricsOptions>;

  constructor(options: MetricsOptions = {}) {
    this.options = {
      enabled: true,
      sampleRate: 1.0,
      historySize: 1000,
      slowThreshold: 5000,
      onSlowRequest: () => {},
      ...options,
    };
  }

  startRequest(url: string): string {
    const requestId = Math.random().toString(36).substring(7);

    if (this.shouldSample()) {
      this.metrics.set(requestId, {
        url,
        startTime: performance.now(),
        dns: 0,
        tcp: 0,
        ttfb: 0,
        total: 0,
        status: 0,
        cached: false,
      });
    }

    return requestId;
  }

  endRequest(requestId: string, status: number, cached: boolean): void {
    const metric = this.metrics.get(requestId);
    if (!metric) return;

    const endTime = performance.now();
    metric.total = endTime - metric.startTime;
    metric.status = status;
    metric.cached = cached;

    if (metric.total > this.options.slowThreshold) {
      this.options.onSlowRequest(metric);
    }

    this.maintainHistorySize();
  }

  private maintainHistorySize(): void {
    if (this.metrics.size > this.options.historySize) {
      const [firstKey] = this.metrics.keys();
      if (firstKey) {
        this.metrics.delete(firstKey);
      }
    }
  }

  private shouldSample(): boolean {
    return this.options.enabled && Math.random() < this.options.sampleRate;
  }

  getMetrics(): RequestMetrics[] {
    return Array.from(this.metrics.values());
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}
