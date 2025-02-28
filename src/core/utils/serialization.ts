// src/core/utils/serialization.ts
export function serializeData(data: any, headers: Record<string, string>): any {
    if (data && typeof data === 'object' && headers['Content-Type']?.includes('application/json')) {
      return JSON.stringify(data);
    }
    return data;
  }
  