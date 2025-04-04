import type { Plugin } from "../../types/plugin";

// Re-export Plugin interface for plugins to import
export type { Plugin } from "../../types/plugin";
import type { RequestConfig } from "../../types/request";
import type { ResponseData } from "../../types/response";

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
  }

  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (plugin?.destroy) {
      plugin.destroy();
    }
    this.plugins.delete(pluginName);
  }

  async executeHook<T extends RequestConfig | ResponseData | any>(
    hookName: "onRequest" | "onResponse" | "onError",
    data: T,
    context?: any
  ): Promise<T> {
    // Get the alternative hook name for backward compatibility
    let alternativeHook: keyof Plugin | null = null;
    if (hookName === "onRequest") alternativeHook = "beforeRequest";
    if (hookName === "onResponse") alternativeHook = "afterResponse";

    const sortedPlugins = Array.from(this.plugins.values())
      .filter((p) => {
        if (!p.enabled) return false;

        // Check if the plugin has the primary hook method
        const hasMainHook =
          hookName === "onRequest"
            ? !!p.onRequest
            : hookName === "onResponse"
            ? !!p.onResponse
            : hookName === "onError"
            ? !!p.onError
            : false;

        // Check if the plugin has the alternative hook method
        const hasAltHook =
          alternativeHook === "beforeRequest"
            ? !!p.beforeRequest
            : alternativeHook === "afterResponse"
            ? !!p.afterResponse
            : false;

        return hasMainHook || hasAltHook;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let result = data;
    for (const plugin of sortedPlugins) {
      // Try to use the primary hook method
      if (hookName === "onRequest" && plugin.onRequest) {
        result = (await plugin.onRequest(
          result as RequestConfig
        )) as unknown as T;
      } else if (hookName === "onResponse" && plugin.onResponse) {
        result = (await plugin.onResponse(
          result as ResponseData
        )) as unknown as T;
      } else if (hookName === "onError" && plugin.onError) {
        result = (await plugin.onError(result)) as T;
      }
      // Try to use the alternative hook method if primary wasn't used
      else if (alternativeHook === "beforeRequest" && plugin.beforeRequest) {
        result = (await plugin.beforeRequest(
          result as RequestConfig
        )) as unknown as T;
      } else if (alternativeHook === "afterResponse" && plugin.afterResponse) {
        result = (await plugin.afterResponse(
          result as ResponseData
        )) as unknown as T;
      }
    }
    return result;
  }

  getPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }
}
