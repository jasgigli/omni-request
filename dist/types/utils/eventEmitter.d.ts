type EventHandler = (...args: any[]) => void;
export declare class EventEmitter {
    private events;
    on(event: string, handler: EventHandler): void;
    off(event: string, handler: EventHandler): void;
    emit(event: string, ...args: any[]): void;
}
export {};
