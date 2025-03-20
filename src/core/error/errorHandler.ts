import type { RequestConfig } from "../../types/request";
import type { RequestError, ErrorType } from "../../types/error";
import type { ResponseData } from "../../types/response";

export class ErrorHandler {
  private fallbackEndpoints: Map<string, string[]> = new Map();
  private messageTemplates: Record<string, string> = {
    NETWORK_ERROR: "Network error occurred: {message}",
    TIMEOUT: "Request timed out: {url}",
    CANCELED: "Request was canceled",
    RESPONSE_PROCESSING_ERROR: "Error processing response: {message}",
    VALIDATION_ERROR: "Validation error: {message}",
  };

  constructor(private client: any) {}

  async handleError(error: RequestError, config: RequestConfig): Promise<any> {
    const category = this.categorizeError(error);

    if (category.allowFallback && this.fallbackEndpoints.has(config.url!)) {
      return this.tryFallbackEndpoints(config);
    }

    error.message = this.getUserMessage(error);

    if (category.shouldLog) {
      await this.logError(error);
    }

    throw error;
  }

  private categorizeError(error: RequestError): {
    name: ErrorType;
    allowFallback: boolean;
    shouldLog: boolean;
    defaultMessage: string;
  } {
    // Implementation here
    return {
      name: error.code,
      allowFallback: true,
      shouldLog: true,
      defaultMessage: "An error occurred",
    };
  }

  private async tryFallbackEndpoints(
    config: RequestConfig
  ): Promise<ResponseData> {
    const fallbacks = this.fallbackEndpoints.get(config.url!)!;

    for (const fallbackUrl of fallbacks) {
      try {
        return await this.client.request({
          ...config,
          url: fallbackUrl,
          _isFallback: true,
        });
      } catch (err) {
        continue;
      }
    }
    throw new Error("All fallback endpoints failed");
  }

  private getUserMessage(error: RequestError): string {
    const category = this.categorizeError(error);
    const template =
      this.messageTemplates[category.name] || category.defaultMessage;

    return template.replace(
      /\{(\w+)\}/g,
      (_, key) =>
        error[key as keyof RequestError] ||
        error.response?.[key as keyof ResponseData] ||
        "?"
    );
  }

  private async logError(error: RequestError): Promise<void> {
    console.error("[OmniRequest Error]", {
      message: error.message,
      code: error.code,
      config: error.config,
      response: error.response,
    });
  }
}
