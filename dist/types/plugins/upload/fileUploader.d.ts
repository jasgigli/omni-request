import { Plugin } from "../../core/plugin/pluginManager";
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
export declare class FileUploaderPlugin implements Plugin {
    name: string;
    enabled: boolean;
    private options;
    constructor(options?: UploadOptions);
    onRequest(config: RequestConfig): Promise<RequestConfig>;
    private handleSimpleUpload;
    private handleChunkedUpload;
    private createProgressHandler;
    private handleChunkError;
}
