import { RequestConfig } from "./request";

export enum ErrorType {
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  ABORT = "ABORT_ERROR",
  PARSE = "PARSE_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  SERVER = "SERVER_ERROR",
  REQUEST = "REQUEST_ERROR",
  CIRCUIT_OPEN = "CIRCUIT_OPEN",
  CANCELED = "CANCELED",
}

export interface RequestErrorOptions {
  message: string;
  config?: RequestConfig;
  status?: number;
  response?: any;
  type?: ErrorType;
}

export class RequestError extends Error {
  status: number;
  config: RequestConfig;
  response?: any;
  type: ErrorType;

  constructor(options: RequestErrorOptions) {
    super(options.message);
    this.name = "RequestError";
    this.status = options.status || 0;
    this.config = options.config || ({} as RequestConfig);
    this.response = options.response;
    this.type = options.type || ErrorType.NETWORK;
  }
}
