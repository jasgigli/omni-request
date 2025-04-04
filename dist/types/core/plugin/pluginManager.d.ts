import type { Plugin } from "../../types/plugin";
export type { Plugin } from "../../types/plugin";
import type { RequestConfig } from "../../types/request";
import type { ResponseData } from "../../types/response";
export declare class PluginManager {
    private plugins;
    register(plugin: Plugin): void;
    unregister(pluginName: string): void;
    executeHook<T extends RequestConfig | ResponseData | any>(hookName: "onRequest" | "onResponse" | "onError", data: T, context?: any): Promise<T>;
    getPlugins(): Plugin[];
    getPlugin(name: string): Plugin | undefined;
}
