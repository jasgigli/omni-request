import { RequestConfig } from "./request";

export interface FileUploadConfig extends RequestConfig {
  file?: {
    file: string;
    uploadUrl: string;
    fieldName?: string;
    metadata?: Record<string, any>;
  };
}

export interface ChunkUploadOptions {
  chunkSize: number;
  concurrency: number;
  retries: number;
  onProgress?: (progress: UploadProgress) => void;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  remainingTime: number;
}

export interface QueuedRequest {
  id: string;
  config: RequestConfig;
  timestamp: number;
  retries: number;
  priority: number;
}

export interface Stats {
  size: number;
  isFile(): boolean;
  isDirectory(): boolean;
  isBlockDevice(): boolean;
  isCharacterDevice(): boolean;
  isSymbolicLink(): boolean;
  isFIFO(): boolean;
  isSocket(): boolean;
}
