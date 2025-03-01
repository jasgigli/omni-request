// src/index.ts
import { RequestClient } from './core/requestClient';
import * as Adapters from './adapters';
import * as Middleware from './middleware';
import * as Plugins from './plugins';
import * as Integrations from './integrations';
import * as Types from './types';

export { RequestClient, Adapters, Middleware, Plugins, Integrations, Types };

// Optionally, if you want a direct named export, you can do:
export { RevalidationCacheMiddleware } from './middleware/revalidationCache';
export { ConcurrencyRateLimitMiddleware } from './middleware/concurrencyRateLimit';
export { IntelligentRetryMiddleware } from './middleware/intelligentRetry';
export { setupAutoAuth } from './plugins/autoAuth';
