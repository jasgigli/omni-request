import { RequestClient } from '../../core/requestClient';
import { ChunkUploadOptions, UploadProgress } from '../../types/upload';

export class ChunkedUploadManager {
  private chunkSize: number;
  private concurrency: number;
  private client: RequestClient;

  constructor(client: RequestClient, options: ChunkUploadOptions) {
    this.client = client;
    this.chunkSize = options.chunkSize || 1024 * 1024; // 1MB default
    this.concurrency = options.concurrency || 3;
  }

  async uploadFile(file: File, endpoint: string): Promise<string> {
    const chunks = this.splitIntoChunks(file);
    const totalChunks = chunks.length;
    let uploadedChunks = 0;

    const uploads = chunks.map(async (chunk, index) => {
      const formData = new FormData();
      formData.append('chunk', chunk);
      formData.append('index', index.toString());
      formData.append('total', totalChunks.toString());
      formData.append('filename', file.name);

      try {
        const response = await this.client.post(endpoint, formData, {
          headers: {
            'X-Upload-Id': file.name,
            'X-Chunk-Index': index.toString(),
          },
          onUploadProgress: (progressEvent) => {
            const progress: UploadProgress = {
              chunk: index,
              total: totalChunks,
              loaded: progressEvent.loaded,
              size: chunk.size,
            };
            this.emit('chunkProgress', progress);
          },
        });

        uploadedChunks++;
        this.emit('chunkComplete', {
          chunk: index,
          total: totalChunks,
          progress: (uploadedChunks / totalChunks) * 100,
        });

        return response;
      } catch (error) {
        this.emit('chunkError', { chunk: index, error });
        throw error;
      }
    });

    // Process chunks with concurrency limit
    const results = await this.processConcurrent(uploads, this.concurrency);
    return this.finalizeUpload(file.name, results);
  }

  private splitIntoChunks(file: File): Blob[] {
    const chunks: Blob[] = [];
    let start = 0;
    
    while (start < file.size) {
      chunks.push(file.slice(start, start + this.chunkSize));
      start += this.chunkSize;
    }

    return chunks;
  }

  private async processConcurrent<T>(tasks: Promise<T>[], concurrency: number): Promise<T[]> {
    const results: T[] = [];
    let index = 0;

    async function processNext(): Promise<void> {
      if (index >= tasks.length) return;
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex];
      await processNext();
    }

    await Promise.all(
      Array(concurrency)
        .fill(null)
        .map(() => processNext())
    );

    return results;
  }

  private async finalizeUpload(filename: string, results: any[]): Promise<string> {
    const response = await this.client.post('/upload/finalize', {
      filename,
      chunks: results.length,
    });
    return response.data.url;
  }
}