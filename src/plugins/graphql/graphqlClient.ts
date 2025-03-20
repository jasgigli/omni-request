import { Plugin } from "../../core/plugin/pluginManager";
import { RequestConfig } from "../../types/request";

export interface GraphQLOptions {
  endpoint: string;
  headers?: Record<string, string>;
  defaultVariables?: Record<string, any>;
}

export class GraphQLPlugin implements Plugin {
  name = "graphql";
  enabled = true;
  private options: GraphQLOptions;

  constructor(options: GraphQLOptions) {
    this.options = options;
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (!config.graphql) return config;

    const { query, variables, operationName } = config.graphql;
    
    return {
      ...config,
      url: this.options.endpoint,
      method: 'POST',
      headers: {
        ...this.options.headers,
        'Content-Type': 'application/json',
      },
      data: {
        query,
        variables: { ...this.options.defaultVariables, ...variables },
        operationName,
      },
    };
  }

  async onResponse(response: ResponseData): Promise<ResponseData> {
    if (!response.data?.errors && !response.data?.data) {
      return response;
    }

    if (response.data.errors) {
      throw new GraphQLError(response.data.errors, response);
    }

    return { ...response, data: response.data.data };
  }
}

class GraphQLError extends Error {
  constructor(public errors: any[], public response: ResponseData) {
    super('GraphQL Error: ' + errors.map(e => e.message).join(', '));
  }
}