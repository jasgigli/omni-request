// src/index.ts
import RequestClient from "./core/requestClient";
import * as Adapters from "./adapters";
import * as Middleware from "./middleware";
import * as Plugins from "./plugins";
import * as Integrations from "./integrations";
import * as Types from "./types";

export { RequestClient, Adapters, Middleware, Plugins, Integrations, Types };

// Also export a default object so consumers can import everything at once.
export default {
  RequestClient,
  Adapters,
  Middleware,
  Plugins,
  Integrations,
  Types,
};
