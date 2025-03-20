export interface RequestMetrics {
  url: string;
  startTime: number;
  dns: number;
  tcp: number;
  ttfb: number;
  total: number;
  status: number;
  cached: boolean;
}

export interface MetricsOptions {
  enabled?: boolean;
  sampleRate?: number;
  historySize?: number;
  slowThreshold?: number;
  onSlowRequest?: (metric: RequestMetrics) => void;
}