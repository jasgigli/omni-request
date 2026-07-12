/**
 * File upload and download utilities with progress tracking
 */

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  timeRemaining: number; // seconds
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number;
  timeRemaining: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  headers?: Record<string, string>;
  chunkSize?: number;
  retries?: number;
}

export interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  headers?: Record<string, string>;
  retries?: number;
}

export class FileUploader {
  private calculateSpeed(
    loaded: number,
    previousLoaded: number,
    timeElapsed: number
  ): number {
    if (timeElapsed === 0) return 0;
    return (loaded - previousLoaded) / timeElapsed;
  }

  private calculateTimeRemaining(
    total: number,
    loaded: number,
    speed: number
  ): number {
    if (speed === 0) return 0;
    return (total - loaded) / speed;
  }

  async uploadFile(
    url: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<any> {
    const { onProgress, headers = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let previousLoaded = 0;
      let previousTime = startTime;

      xhr.open('POST', url, true);

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Track progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const currentTime = Date.now();
          const timeElapsed = (currentTime - previousTime) / 1000;
          const loaded = event.loaded;
          const total = event.total;

          const speed = this.calculateSpeed(loaded, previousLoaded, timeElapsed);
          const timeRemaining = this.calculateTimeRemaining(total, loaded, speed);

          onProgress({
            loaded,
            total,
            percentage: (loaded / total) * 100,
            speed,
            timeRemaining
          });

          previousLoaded = loaded;
          previousTime = currentTime;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed due to network error'));
      };

      xhr.onabort = () => {
        reject(new Error('Upload was aborted'));
      };

      const formData = new FormData();
      formData.append('file', file);

      xhr.send(formData);
    });
  }

  async uploadFileWithRetry(
    url: string,
    file: File | Blob,
    options: UploadOptions = {}
  ): Promise<any> {
    const { retries = 3 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.uploadFile(url, file, options);
      } catch (error) {
        lastError = error as Error;
        if (i < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  async uploadChunked(
    url: string,
    file: File,
    options: UploadOptions = {}
  ): Promise<any> {
    const { chunkSize = 1024 * 1024, onProgress, headers = {} } = options;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunks: Blob[] = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      chunks.push(file.slice(start, end));
    }

    const uploadId = `${file.name}-${Date.now()}`;
    let uploadedChunks = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const chunkHeaders = {
        ...headers,
        'Content-Range': `bytes ${i * chunkSize}-${Math.min((i + 1) * chunkSize, file.size) - 1}/${file.size}`,
        'X-Upload-Id': uploadId,
        'X-Chunk-Index': i.toString(),
        'X-Total-Chunks': totalChunks.toString()
      };

      await this.uploadFile(url, chunk, { headers: chunkHeaders });
      uploadedChunks++;

      if (onProgress) {
        onProgress({
          loaded: uploadedChunks * chunkSize,
          total: file.size,
          percentage: (uploadedChunks / totalChunks) * 100,
          speed: 0,
          timeRemaining: 0
        });
      }
    }

    return { uploadId, chunks: totalChunks };
  }
}

export class FileDownloader {
  private calculateSpeed(
    loaded: number,
    previousLoaded: number,
    timeElapsed: number
  ): number {
    if (timeElapsed === 0) return 0;
    return (loaded - previousLoaded) / timeElapsed;
  }

  private calculateTimeRemaining(
    total: number,
    loaded: number,
    speed: number
  ): number {
    if (speed === 0) return 0;
    return (total - loaded) / speed;
  }

  async downloadFile(
    url: string,
    filename?: string,
    options: DownloadOptions = {}
  ): Promise<Blob> {
    const { onProgress, headers = {} } = options;

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const startTime = Date.now();
      let previousLoaded = 0;
      let previousTime = startTime;

      xhr.open('GET', url, true);
      xhr.responseType = 'blob';

      // Set headers
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      // Track progress
      xhr.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const currentTime = Date.now();
          const timeElapsed = (currentTime - previousTime) / 1000;
          const loaded = event.loaded;
          const total = event.total;

          const speed = this.calculateSpeed(loaded, previousLoaded, timeElapsed);
          const timeRemaining = this.calculateTimeRemaining(total, loaded, speed);

          onProgress({
            loaded,
            total,
            percentage: (loaded / total) * 100,
            speed,
            timeRemaining
          });

          previousLoaded = loaded;
          previousTime = currentTime;
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const blob = xhr.response;
          
          // Trigger download if filename is provided
          if (filename) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
          }
          
          resolve(blob);
        } else {
          reject(new Error(`Download failed with status ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Download failed due to network error'));
      };

      xhr.onabort = () => {
        reject(new Error('Download was aborted'));
      };

      xhr.send();
    });
  }

  async downloadFileWithRetry(
    url: string,
    filename?: string,
    options: DownloadOptions = {}
  ): Promise<Blob> {
    const { retries = 3 } = options;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.downloadFile(url, filename, options);
      } catch (error) {
        lastError = error as Error;
        if (i < retries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    throw lastError;
  }

  async downloadAsDataURL(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const blob = await this.downloadFile(url, undefined, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }

  async downloadAsText(
    url: string,
    options: DownloadOptions = {}
  ): Promise<string> {
    const blob = await this.downloadFile(url, undefined, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to convert blob to text'));
      reader.readAsText(blob);
    });
  }
}

// Global instances
export const fileUploader = new FileUploader();
export const fileDownloader = new FileDownloader();

// Convenience functions
export async function uploadFile(
  url: string,
  file: File | Blob,
  options?: UploadOptions
): Promise<any> {
  return fileUploader.uploadFile(url, file, options);
}

export async function downloadFile(
  url: string,
  filename?: string,
  options?: DownloadOptions
): Promise<Blob> {
  return fileDownloader.downloadFile(url, filename, options);
}
