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
export declare class MetricsCollector {
    private metrics;
    private listeners;
    addMetric(metric: RequestMetrics): void;
    onMetric(callback: (metric: RequestMetrics) => void): () => void;
    getAverageResponseTime(): number;
    getErrorRate(): number;
    getCacheHitRate(): number;
    private notifyListeners;
}
