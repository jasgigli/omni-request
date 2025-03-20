import { Plugin } from "../../core/plugin/pluginManager";
import { createReadStream, statSync } from 'fs';
import { basename } from 'path';

export interface UploadOptions {
  chunkSize?: number;
  concurrent?: number;
  onProgress?: (progress: UploadProgress) => void;
  resumable?: boolean;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  remainingTime: number;
}

export class FileUploaderPlugin implements Plugin {
  name = "fileUploader";
  enabled = true;
  private options: UploadOptions;

  constructor(options: UploadOptions = {}) {
    this.options = {
      chunkSize: 1024 * 1024, // 1MB
      concurrent: 3,
      resumable: true,
      ...options
    };
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    if (!config.file) return config;

    const { file, uploadUrl } = config.file;
    const stats = statSync(file);

    if (stats.size <= this.options.chunkSize!) {
      return this.handleSimpleUpload(config, file, stats);
    }

    return this.handleChunkedUpload(config, file, stats);
  }

  private async handleSimpleUpload(
    config: RequestConfig,
    file: string,
    stats: Stats
  ): Promise<RequestConfig> {
    const formData = new FormData();
    formData.append('file', createReadStream(file));

    return {
      ...config,
      data: formData,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: this.createProgressHandler(stats.size),
    };
  }

  private async handleChunkedUpload(
    config: RequestConfig,
    file: string,
    stats: Stats
  ): Promise<RequestConfig> {
    const chunks = Math.ceil(stats.size / this.options.chunkSize!);
    const uploads = [];

    for (let i = 0; i < chunks; i++) {
      const start = i * this.options.chunkSize!;
      const end = Math.min(start + this.options.chunkSize!, stats.size);

      uploads.push(this.uploadChunk(config, file, start, end, i, chunks));
    }

    await Promise.all(uploads.map(
      upload => upload.catch(err => this.handleChunkError(err))
    ));

    return config;
  }

  private createProgressHandler(total: number) {
    let startTime = Date.now();
    let lastLoaded = 0;

    return (progressEvent: any) => {
      const currentTime = Date.now();
      const loaded = progressEvent.loaded;
      const speed = (loaded - lastLoaded) / ((currentTime - startTime) / 1000);
      
      const progress: UploadProgress = {
        loaded,
        total,
        percentage: (loaded / total) * 100,
        speed,
        remainingTime: (total - loaded) / speed
      };

      this.options.onProgress?.(progress);

      lastLoaded = loaded;
      startTime = currentTime;
    };
  }

  private async handleChunkError(error: any) {
    // Implement retry logic here
    console.error('Chunk upload failed:', error);
    throw error;
  }
}