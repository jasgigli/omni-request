export interface Interceptor<T> {
    resolved: (value: T) => T | Promise<T>;
    rejected?: (error: any) => any;
}
export declare class InterceptorManager<T> {
    private interceptors;
    use(resolved: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number;
    eject(id: number): void;
    forEach(fn: (interceptor: Interceptor<T>) => void): void;
}
