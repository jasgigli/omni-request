import { RequestClient } from '../../core/requestClient';
import { ChunkUploadOptions } from '../../types/upload';
export declare class ChunkedUploadManager {
    private chunkSize;
    private concurrency;
    private client;
    constructor(client: RequestClient, options: ChunkUploadOptions);
    uploadFile(file: File, endpoint: string): Promise<string>;
    private splitIntoChunks;
    private processConcurrent;
    private finalizeUpload;
}
