import { browserAdapter } from "./browserAdapter";
import { nodeAdapter } from "./nodeAdapter";
import { Adapter } from "./adapter";

// Function to detect the current environment and return appropriate adapter
export function getAdapter(): Adapter {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return browserAdapter;
  }

  // Node.js environment
  return nodeAdapter;
}

export { browserAdapter, nodeAdapter };
