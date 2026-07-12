/**
 * Request and response transformation utilities
 */

export interface TransformOptions {
  request?: (data: any) => any;
  response?: (data: any) => any;
  requestError?: (error: any) => any;
  responseError?: (error: any) => any;
}

/**
 * Transform request data before sending
 */
export function transformRequestData(data: any, transformer?: (data: any) => any): any {
  if (!transformer) return data;
  try {
    return transformer(data);
  } catch (error) {
    console.error('Request transform error:', error);
    return data;
  }
}

/**
 * Transform response data after receiving
 */
export function transformResponseData(data: any, transformer?: (data: any) => any): any {
  if (!transformer) return data;
  try {
    return transformer(data);
  } catch (error) {
    console.error('Response transform error:', error);
    return data;
  }
}

/**
 * Transform error before throwing
 */
export function transformError(error: any, transformer?: (error: any) => any): any {
  if (!transformer) return error;
  try {
    return transformer(error);
  } catch (transformError) {
    console.error('Error transform error:', transformError);
    return error;
  }
}

/**
 * Common transformers
 */
export const CommonTransformers = {
  /**
   * Convert object to URL-encoded string
   */
  toURLEncoded: (data: any): string => {
    return new URLSearchParams(data).toString();
  },

  /**
   * Convert object to JSON string
   */
  toJSON: (data: any): string => {
    return JSON.stringify(data);
  },

  /**
   * Parse JSON string to object
   */
  fromJSON: (data: string): any => {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  },

  /**
   * Convert camelCase to snake_case
   */
  camelToSnake: (data: any): any => {
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => CommonTransformers.camelToSnake(item));
    }
    
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        result[snakeKey] = CommonTransformers.camelToSnake(data[key]);
      }
    }
    return result;
  },

  /**
   * Convert snake_case to camelCase
   */
  snakeToCamel: (data: any): any => {
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => CommonTransformers.snakeToCamel(item));
    }
    
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = CommonTransformers.snakeToCamel(data[key]);
      }
    }
    return result;
  },

  /**
   * Trim string values in object
   */
  trimStrings: (data: any): any => {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => CommonTransformers.trimStrings(item));
    }
    
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = CommonTransformers.trimStrings(data[key]);
      }
    }
    return result;
  },

  /**
   * Convert dates to ISO strings
   */
  datesToISO: (data: any): any => {
    if (data instanceof Date) {
      return data.toISOString();
    }
    
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => CommonTransformers.datesToISO(item));
    }
    
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = CommonTransformers.datesToISO(data[key]);
      }
    }
    return result;
  },

  /**
   * Convert ISO strings to Date objects
   */
  isoToDates: (data: any): any => {
    if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(data)) {
      return new Date(data);
    }
    
    if (typeof data !== 'object' || data === null) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => CommonTransformers.isoToDates(item));
    }
    
    const result: any = {};
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = CommonTransformers.isoToDates(data[key]);
      }
    }
    return result;
  }
};
