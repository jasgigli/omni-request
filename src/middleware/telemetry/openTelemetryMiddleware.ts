import { Middleware } from "../../types/middleware";
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
import { trace, context, SpanStatusCode } from '@opentelemetry/api';

export interface TelemetryOptions {
  serviceName?: string;
  includeHeaders?: boolean;
  includeBody?: boolean;
  filterSensitiveData?: (key: string, value: any) => any;
}

export class OpenTelemetryMiddleware implements Middleware {
  private options: TelemetryOptions;

  constructor(options: TelemetryOptions = {}) {
    this.options = {
      serviceName: 'omnirequest',
      includeHeaders: true,
      includeBody: false,
      filterSensitiveData: (k, v) => v,
      ...options
    };
  }

  request = async (config: RequestConfig): Promise<RequestConfig> => {
    const tracer = trace.getTracer(this.options.serviceName!);
    
    return await tracer.startActiveSpan(`HTTP ${config.method}`, async (span) => {
      try {
        // Add request attributes
        span.setAttribute('http.url', config.url);
        span.setAttribute('http.method', config.method || 'GET');
        
        if (this.options.includeHeaders) {
          const safeHeaders = this.filterSensitiveData(config.headers);
          span.setAttribute('http.request.headers', JSON.stringify(safeHeaders));
        }

        // Attach span context to request for correlation
        config.headers = {
          ...config.headers,
          'traceparent': span.spanContext().traceId
        };

        return config;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.end();
        throw error;
      }
    });
  }

  response = async (response: ResponseData): Promise<ResponseData> => {
    const currentSpan = trace.getSpan(context.active());
    
    if (currentSpan) {
      currentSpan.setAttribute('http.status_code', response.status);
      currentSpan.setStatus({ code: SpanStatusCode.OK });
      currentSpan.end();
    }

    return response;
  }

  private filterSensitiveData(data: any): any {
    if (!data) return data;
    
    const filtered = { ...data };
    for (const [key, value] of Object.entries(filtered)) {
      filtered[key] = this.options.filterSensitiveData!(key, value);
    }
    return filtered;
  }
}