export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoredErrors: number[];
  halfOpenMaxRequests?: number;
  onStateChange?: (state: CircuitBreakerState) => void;
  onFailure?: (error: any) => void;
  onSuccess?: () => void;
}

export interface CircuitBreakerStats {
  state: CircuitBreakerState;
  failureCount: number;
  lastFailureTime: number | null;
  successCount: number;
  totalRequests: number;
}