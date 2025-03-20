import { RequestConfig } from '../types/request';

export function mergeConfig(config1: RequestConfig, config2: RequestConfig = {}): RequestConfig {
  const config: RequestConfig = {};

  const mergeDeep = (obj1: any, obj2: any) => {
    const result = { ...obj1 };
    Object.keys(obj2).forEach(key => {
      if (typeof obj2[key] === 'object' && !Array.isArray(obj2[key])) {
        result[key] = mergeDeep(obj1[key] || {}, obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    });
    return result;
  };

  // Merge headers specially
  config.headers = mergeDeep(config1.headers || {}, config2.headers || {});

  // Merge everything else
  return {
    ...config1,
    ...config2,
    headers: config.headers
  };
}