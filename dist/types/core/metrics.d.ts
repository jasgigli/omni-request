import { MetricsOptions, RequestMetrics } from "../types/metrics";
export declare class PerformanceMetrics {
    private metrics;
    private options;
    constructor(options?: MetricsOptions);
    startRequest(url: string): string;
    endRequest(requestId: string, status: number, cached: boolean): void;
    private maintainHistorySize;
    private shouldSample;
    getMetrics(): RequestMetrics[];
    clearMetrics(): void;
}
