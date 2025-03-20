import { Plugin } from "../../core/plugin/pluginManager";
import { z } from "zod";
import { ResponseData } from "../../types/response";

export interface TransformOptions {
  request?: {
    schemas?: Record<string, z.ZodType>;
    transforms?: Record<string, (data: any) => any>;
  };
  response?: {
    schemas?: Record<string, z.ZodType>;
    transforms?: Record<string, (data: any) => any>;
  };
}

export class DataTransformerPlugin implements Plugin {
  name = "dataTransformer";
  enabled = true;
  private options: TransformOptions;

  constructor(options: TransformOptions = {}) {
    this.options = options;
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (!config.data) return config;

    const schema = this.options.request?.schemas?.[config.url];
    const transform = this.options.request?.transforms?.[config.url];

    let data = config.data;
    if (schema) {
      data = schema.parse(data);
    }
    if (transform) {
      data = transform(data);
    }

    return { ...config, data };
  }

  async onResponse(response: ResponseData): Promise<ResponseData> {
    if (!response.data) return response;

    const schema = this.options.response?.schemas?.[response.config.url];
    const transform = this.options.response?.transforms?.[response.config.url];

    let data = response.data;
    if (schema) {
      data = schema.parse(data);
    }
    if (transform) {
      data = transform(data);
    }

    return { ...response, data };
  }
}