import { RequestError, ErrorType } from "../types/error";
import { RequestConfig } from "../types/request";
import { Middleware } from "../types/middleware";
import { ResponseData } from "../types/response";

interface CircuitState {
  failures: number;
  lastFailure: number;
  open: boolean;
  halfOpen: boolean;
  reopenTime: number;
}

interface CircuitBreakerConfig {
  threshold: number;
  cooldown: number;
}

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  jitter: boolean;
  circuitBreaker?: CircuitBreakerConfig;
}

export class IntelligentRetryMiddleware implements Middleware {
  private circuits: Map<string, CircuitState> = new Map();
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 3,
      baseDelay: 1000,
      jitter: true,
      ...config,
    };
  }

  private getCircuitKey(config: RequestConfig): string {
    return `${config.method || "GET"}-${config.url}`;
  }

  private getCircuitState(config: RequestConfig): CircuitState {
    const key = this.getCircuitKey(config);
    let state = this.circuits.get(key);

    if (!state) {
      state = {
        failures: 0,
        lastFailure: 0,
        open: false,
        halfOpen: false,
        reopenTime: 0,
      };
      this.circuits.set(key, state);
    }

    return state;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private resetCircuit(state: CircuitState): void {
    state.failures = 0;
    state.open = false;
    state.halfOpen = false;
    state.reopenTime = 0;
  }

  private incrementFailure(state: CircuitState): void {
    state.failures++;
    state.lastFailure = Date.now();

    if (
      this.config.circuitBreaker &&
      state.failures >= this.config.circuitBreaker.threshold
    ) {
      state.open = true;
      state.reopenTime = Date.now() + this.config.circuitBreaker.cooldown;
    }
  }

  request = async (config: RequestConfig): Promise<RequestConfig> => {
    const circuitState = this.getCircuitState(config);
    if (circuitState.open && !circuitState.halfOpen) {
      const now = Date.now();
      if (now < circuitState.reopenTime) {
        throw new RequestError(
          "Circuit is open for endpoint. Failing fast.",
          config,
          "CIRCUIT_OPEN"
        );
      } else {
        circuitState.halfOpen = true;
      }
    }
    return config;
  };

  error = async (error: RequestError): Promise<ResponseData | RequestError> => {
    const config = error.config;
    const circuitState = this.getCircuitState(config);
    const retryCount = (config._retryCount || 0) + 1;

    if (retryCount > this.config.maxRetries) {
      this.incrementFailure(circuitState);
      throw error;
    }

    if (!this.shouldRetry(error)) {
      this.incrementFailure(circuitState);
      throw error;
    }

    const delay = this.calculateDelay(retryCount);
    await this.sleep(delay);

    const newConfig = {
      ...config,
      _retryCount: retryCount,
    };

    try {
      const client = error.response?.config?.client || config.client;
      if (!client) {
        this.incrementFailure(circuitState);
        throw error;
      }

      const response = await client.request(newConfig);
      this.resetCircuit(circuitState);
      return response;
    } catch (err) {
      this.incrementFailure(circuitState);
      throw err;
    }
  };

  private shouldRetry(error: RequestError): boolean {
    if (error.type === "NETWORK_ERROR") return true;
    if (error.response?.status && error.response.status >= 500) return true;
    return false;
  }

  private calculateDelay(retryCount: number): number {
    const baseDelay = this.config.baseDelay * Math.pow(2, retryCount - 1);
    if (!this.config.jitter) return baseDelay;

    const jitterMax = baseDelay * 0.2;
    return baseDelay + Math.random() * jitterMax;
  }
}
