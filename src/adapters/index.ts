import { browserAdapter } from "./browserAdapter";
import { Adapter } from "./adapter";

// Function to detect the current environment and return appropriate adapter
export function getAdapter(): Adapter {
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    return browserAdapter;
  }

  // Add other environment checks and adapters here
  // For now, default to browser adapter
  return browserAdapter;
}

export { browserAdapter };
