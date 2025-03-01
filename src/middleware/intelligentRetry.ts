// src/middleware/intelligentRetry.ts
import { Middleware } from "../types/middleware";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError } from "../types/error";

/**
 * Options for IntelligentRetryMiddleware
 */
export interface IntelligentRetryOptions {
  /**
   * Max number of retries before giving up
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds for exponential backoff (e.g., 1000)
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds (to cap exponential growth)
   */
  maxDelay?: number;

  /**
   * If true, adds random jitter to each backoff delay
   */
  jitter?: boolean;

  /**
   * A function to determine if a request error should be retried.
   * If omitted, we default to retrying network errors and 5xx.
   */
  retryCondition?: (error: RequestError) => boolean;

  /**
   * Circuit breaker configuration.
   * - threshold: number of consecutive failures before opening circuit
   * - cooldown: how long (ms) the circuit stays open before half‑open
   */
  circuitBreaker?: {
    threshold: number;
    cooldown: number;
  };
}

/**
 * Per‑endpoint circuit state
 */
interface CircuitState {
  consecutiveFailures: number;   // how many consecutive failures
  open: boolean;                 // is circuit fully open?
  reopenTime: number;            // when circuit can go half‑open
  halfOpen: boolean;             // if we allow 1 test request
}

export class IntelligentRetryMiddleware implements Middleware {
  private options: IntelligentRetryOptions;

  /**
   * Track circuit states by endpoint key
   */
  private circuitMap = new Map<string, CircuitState>();

  constructor(options: IntelligentRetryOptions = {}) {
    this.options = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30_000,
      jitter: true,
      retryCondition: defaultRetryCondition,
      ...options
    };
  }

  /**
   * Optional: We do nothing special in the request or response hooks here.
   * The main logic is in 'error' for retrying and circuit breaker handling.
   */
  request = async (config: RequestConfig): Promise<RequestConfig> => {
    const circuitState = this.getCircuitState(config);
    // If circuit is open and not half‑open, fail fast
    if (circuitState.open && !circuitState.halfOpen) {
      const now = Date.now();
      if (now < circuitState.reopenTime) {
        // Circuit is fully open, fail immediately
        throw new RequestError(
          "Circuit is open for endpoint. Failing fast.",
          config,
          "CIRCUIT_OPEN"
        );
      } else {
        // Move to half‑open state
        circuitState.halfOpen = true;
      }
    }
    return config;
  };

  response = async (response: ResponseData): Promise<ResponseData> => {
    // On success, reset circuit state for this endpoint
    const circuitState = this.getCircuitState(response.config);
    this.resetCircuit(circuitState);
    return response;
  };

  /**
   * The main logic: if a request fails, decide whether to retry or open circuit.
   */
  error = async (error: any): Promise<any> => {
    // If the error doesn't have config, just return it
    if (!error.config) {
      return error;
    }

    const config = error.config;
    const circuitState = this.getCircuitState(config);

    // If circuit is half‑open and we still failed, re‑open
    if (circuitState.halfOpen) {
      this.openCircuit(circuitState);
      return error;
    }

    // Check if we should retry
    const shouldRetry = this.options.retryCondition!(error);
    if (!shouldRetry) {
      // Not eligible for retry => increment consecutiveFailures
      this.incrementFailure(circuitState);
      return error;
    }

    // Check retry count
    const retryCount = config._retryCount || 0;
    if (retryCount >= (this.options.maxRetries || 3)) {
      // Exceeded max retries => increment failure, maybe open circuit
      this.incrementFailure(circuitState);
      return error;
    }

    // Otherwise, do an exponential backoff with optional jitter
    const delayMs = this.calculateDelay(retryCount);
    await new Promise((resolve) => setTimeout(resolve, delayMs));

    // Increment the config retry count
    const newConfig = {
      ...config,
      _retryCount: retryCount + 1
    };

    // We rethrow a special error or do a direct re‑request?
    // The typical approach is to re-run the adapter or re-run request pipeline:
    try {
      const client = (error.response && error.response.config && error.response.config.client) ||
                     config.client;
      if (!client) {
        // If we have no reference to the RequestClient, we can't easily re‑invoke
        // We'll just return error
        this.incrementFailure(circuitState);
        return error;
      }
      // Re-run the request using the same pipeline
      const newResponse = await client.request(newConfig);
      // On success => reset circuit
      this.resetCircuit(circuitState);
      return newResponse;
    } catch (err2) {
      // Another error => increment failure
      this.incrementFailure(circuitState);
      return err2;
    }
  };

  /**
   * Increment consecutiveFailures, check circuit threshold
   */
  private incrementFailure(state: CircuitState) {
    state.consecutiveFailures++;
    const cb = this.options.circuitBreaker;
    if (cb && state.consecutiveFailures >= cb.threshold && !state.open) {
      this.openCircuit(state);
    }
  }

  /**
   * Open the circuit for cooldown
   */
  private openCircuit(state: CircuitState) {
    const cb = this.options.circuitBreaker;
    if (!cb) return;
    state.open = true;
    state.halfOpen = false;
    state.reopenTime = Date.now() + cb.cooldown;
  }

  /**
   * Reset circuit state on success
   */
  private resetCircuit(state: CircuitState) {
    state.consecutiveFailures = 0;
    state.open = false;
    state.halfOpen = false;
    state.reopenTime = 0;
  }

  /**
   * Return the circuit state for the given endpoint
   */
  private getCircuitState(config: RequestConfig): CircuitState {
    const endpoint = config.url;
    if (!this.circuitMap.has(endpoint)) {
      this.circuitMap.set(endpoint, {
        consecutiveFailures: 0,
        open: false,
        reopenTime: 0,
        halfOpen: false
      });
    }
    return this.circuitMap.get(endpoint)!;
  }

  /**
   * Exponential backoff calculation with optional jitter
   */
  private calculateDelay(retryCount: number): number {
    const base = this.options.baseDelay || 1000;
    const max = this.options.maxDelay || 30_000;
    // e.g. 2^(retryCount) * base
    let delay = base * Math.pow(2, retryCount);
    if (delay > max) {
      delay = max;
    }
    if (this.options.jitter) {
      // add random jitter up to 50% of the delay
      const jitterAmount = Math.random() * 0.5 * delay;
      delay += jitterAmount;
    }
    return delay;
  }
}

/**
 * Default retry condition:
 * - Retry on network errors (isNetworkError === true)
 * - Retry on HTTP 5xx status if error.response is present
 */
function defaultRetryCondition(error: RequestError): boolean {
  if (error.isNetworkError) return true;
  const status = error.response?.status;
  if (status && status >= 500) return true;
  return false;
}
