import { Plugin } from "../../core/plugin/pluginManager";
import { createReadStream, statSync } from "fs";
import { basename } from "path";
import { RequestConfig } from "../../types/request";
import { FileUploadConfig, Stats } from "../../types/upload";

// FormData polyfill for Node.js environments
declare global {
  interface FormData {
    append(name: string, value: any, filename?: string): void;
  }
}

// Simple FormData implementation for Node.js
class NodeFormData {
  private data: Map<string, any> = new Map();

  append(name: string, value: any, filename?: string): void {
    this.data.set(name, { value, filename });
  }

  get(name: string): any {
    return this.data.get(name)?.value;
  }

  getAll(name: string): any[] {
    const entry = this.data.get(name);
    return entry ? [entry.value] : [];
  }

  // Convert to format suitable for request body
  toRequestBody(): any {
    // In a real implementation, this would convert to multipart/form-data
    return Object.fromEntries(
      Array.from(this.data.entries()).map(([key, entry]) => [key, entry.value])
    );
  }
}

// Use browser FormData if available, otherwise use our polyfill
const FormDataImpl = typeof FormData !== "undefined" ? FormData : NodeFormData;

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
      ...options,
    };
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    const fileConfig = config as FileUploadConfig;
    if (!fileConfig.file) return config;

    const { file, uploadUrl } = fileConfig.file;
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
    formData.append("file", createReadStream(file));

    return {
      ...config,
      data: formData,
      headers: {
        ...config.headers,
        "Content-Type": "multipart/form-data",
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

    await Promise.all(
      uploads.map((upload) =>
        upload.catch((err: any) => this.handleChunkError(err))
      )
    );

    return config;
  }

  private async uploadChunk(
    config: RequestConfig,
    file: string,
    start: number,
    end: number,
    chunkIndex: number,
    totalChunks: number
  ): Promise<any> {
    const fileConfig = config as FileUploadConfig;
    if (!fileConfig.file) throw new Error("File configuration is missing");

    const { uploadUrl } = fileConfig.file;
    const formData = new FormDataImpl();

    // Create a readable stream for just this chunk
    const stream = createReadStream(file, { start, end: end - 1 });

    // Convert stream to blob for browser environments or use directly in Node
    const chunk = stream;

    // Add chunk metadata
    formData.append("chunkIndex", chunkIndex.toString());
    formData.append("totalChunks", totalChunks.toString());
    formData.append("fileName", basename(file));
    const fileStats = statSync(file);
    formData.append("fileSize", fileStats.size.toString());
    formData.append("chunk", chunk);

    // Make the request
    const body =
      formData instanceof NodeFormData ? formData.toRequestBody() : formData;

    // Use fetch in browser or a custom implementation in Node.js
    let response;
    if (typeof fetch !== "undefined") {
      response = await fetch(uploadUrl, {
        method: "POST",
        body,
      });
    } else {
      // For Node.js environments without fetch
      const http = require("http");
      const https = require("https");
      const url = new URL(uploadUrl);

      response = await new Promise((resolve, reject) => {
        const requestOptions = {
          method: "POST",
          hostname: url.hostname,
          path: url.pathname + url.search,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        };

        const req = (url.protocol === "https:" ? https : http).request(
          requestOptions,
          (res) => {
            let data = "";
            res.on("data", (chunk) => {
              data += chunk;
            });
            res.on("end", () => {
              resolve({
                ok: res.statusCode >= 200 && res.statusCode < 300,
                status: res.statusCode,
                statusText: res.statusMessage,
                json: () => Promise.resolve(JSON.parse(data)),
                text: () => Promise.resolve(data),
              });
            });
          }
        );

        req.on("error", reject);

        if (typeof body === "string") {
          req.write(body);
        } else {
          req.write(JSON.stringify(body));
        }

        req.end();
      });
    }

    if (!response.ok) {
      throw new Error(
        `Failed to upload chunk ${chunkIndex}: ${response.statusText}`
      );
    }

    return response.json();
  }

  private handleChunkError(err: any): void {
    console.error("Chunk upload error:", err);
    // Implement retry logic or other error handling as needed
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
        remainingTime: (total - loaded) / speed,
      };

      this.options.onProgress?.(progress);

      lastLoaded = loaded;
      startTime = currentTime;
    };
  }

  private async handleChunkError(error: any) {
    // Implement retry logic here
    console.error("Chunk upload failed:", error);
    throw error;
  }
}
