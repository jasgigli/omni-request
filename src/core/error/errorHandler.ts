export class ErrorHandler {
  private errorCategories = new Map<string, ErrorCategory>();
  private fallbackEndpoints = new Map<string, string[]>();
  private messageTemplates: Record<string, string> = {};

  constructor(options: ErrorHandlerOptions = {}) {
    this.initializeDefaultCategories();
    this.messageTemplates = options.messageTemplates || {};
  }

  categorizeError(error: any): ErrorCategory {
    if (error.isNetworkError) return this.errorCategories.get("network")!;
    if (error.response?.status >= 500)
      return this.errorCategories.get("server")!;
    if (error.response?.status === 429)
      return this.errorCategories.get("rateLimit")!;
    if (error.response?.status === 401)
      return this.errorCategories.get("auth")!;
    return this.errorCategories.get("unknown")!;
  }

  async handleError(error: any, config: RequestConfig): Promise<any> {
    const category = this.categorizeError(error);

    // Try fallback endpoints if available
    if (category.allowFallback && this.fallbackEndpoints.has(config.url)) {
      return this.tryFallbackEndpoints(config);
    }

    // Transform error message
    error.userMessage = this.getUserMessage(error);

    // Log error if needed
    if (category.shouldLog) {
      await this.logError(error);
    }

    throw error;
  }

  private async tryFallbackEndpoints(config: RequestConfig): Promise<any> {
    const fallbacks = this.fallbackEndpoints.get(config.url)!;

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

  private getUserMessage(error: any): string {
    const category = this.categorizeError(error);
    const template =
      this.messageTemplates[category.name] || category.defaultMessage;

    return template.replace(
      /\{(\w+)\}/g,
      (_, key) => error[key] || error.response?.[key] || "?"
    );
  }
}
