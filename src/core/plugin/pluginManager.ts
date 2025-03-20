import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";

export interface Plugin {
  name: string;
  enabled: boolean;
  priority?: number;
  onRequest?: (config: RequestConfig) => Promise<RequestConfig>;
  onResponse?: (response: ResponseData) => Promise<ResponseData>;
  onError?: (error: any) => Promise<any>;
  destroy?: () => void;
}

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }
    this.plugins.set(plugin.name, { priority: 0, ...plugin });
  }

  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin?.destroy) {
      plugin.destroy();
    }
    this.plugins.delete(pluginName);
  }

  enable(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = true;
    }
  }

  disable(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin) {
      plugin.enabled = false;
    }
  }

  async executeHook<T>(
    hookName: 'onRequest' | 'onResponse' | 'onError',
    data: T
  ): Promise<T> {
    const sortedPlugins = Array.from(this.plugins.values())
      .filter(p => p.enabled && p[hookName])
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let result = data;
    for (const plugin of sortedPlugins) {
      result = await plugin[hookName]!(result);
    }
    return result;
  }
}