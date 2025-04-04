import { RequestError, ErrorType } from "../../types/error";
import type { RequestConfig } from "../../types/request";

interface ErrorCategory {
  allowFallback: boolean;
  shouldLog: boolean;
}

export class ErrorHandler {
  private fallbackEndpoints = new Map<string, string[]>();

  constructor(private client: any) {}

  async handleError(error: RequestError, config: RequestConfig): Promise<any> {
    const category = this.categorizeError(error);

    if (category.allowFallback && this.fallbackEndpoints.has(config.url!)) {
      return this.tryFallbackEndpoints(config);
    }

    if (category.shouldLog) {
      await this.logError(error);
    }

    throw error;
  }

  private categorizeError(error: RequestError): ErrorCategory {
    switch (error.type) {
      case ErrorType.NETWORK:
        return { allowFallback: true, shouldLog: true };
      case ErrorType.TIMEOUT:
        return { allowFallback: true, shouldLog: true };
      case ErrorType.CIRCUIT_OPEN:
        return { allowFallback: true, shouldLog: false };
      case ErrorType.VALIDATION:
        return { allowFallback: false, shouldLog: true };
      case ErrorType.PARSE:
        return { allowFallback: false, shouldLog: true };
      case ErrorType.CANCELED:
        return { allowFallback: false, shouldLog: false };
      default:
        return { allowFallback: false, shouldLog: true };
    }
  }

  private async logError(error: RequestError): Promise<void> {
    console.error(`[OmniRequest Error] ${error.message}`, {
      type: error.type,
      status: error.status,
      config: error.config,
    });
  }

  private async tryFallbackEndpoints(config: RequestConfig): Promise<any> {
    const fallbacks = this.fallbackEndpoints.get(config.url!);
    if (!fallbacks?.length) {
      throw new RequestError({
        message: "No fallback endpoints available",
        config,
        type: ErrorType.REQUEST,
        status: 0,
      });
    }

    for (const fallbackUrl of fallbacks) {
      try {
        return await this.client.request({
          ...config,
          url: fallbackUrl,
        });
      } catch (error) {
        continue;
      }
    }

    throw new RequestError({
      message: "All fallback endpoints failed",
      config,
      type: ErrorType.REQUEST,
      status: 0,
    });
  }
}
