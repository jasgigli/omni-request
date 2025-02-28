// src/core/utils/headers.ts
export function mergeHeaders(...headerObjects: Array<Record<string, string> | undefined>): Record<string, string> {
    return Object.assign({}, ...headerObjects);
  }
  