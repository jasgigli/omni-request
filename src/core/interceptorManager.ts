export interface Interceptor<T> {
  resolved: (value: T) => T | Promise<T>;
  rejected?: (error: any) => any;
}

export class InterceptorManager<T> {
  private interceptors: (Interceptor<T> | null)[] = [];

  use(resolved: (value: T) => T | Promise<T>, rejected?: (error: any) => any): number {
    this.interceptors.push({
      resolved,
      rejected
    });
    return this.interceptors.length - 1;
  }

  eject(id: number): void {
    if (this.interceptors[id]) {
      this.interceptors[id] = null;
    }
  }

  forEach(fn: (interceptor: Interceptor<T>) => void): void {
    this.interceptors.forEach(interceptor => {
      if (interceptor !== null) {
        fn(interceptor);
      }
    });
  }
}