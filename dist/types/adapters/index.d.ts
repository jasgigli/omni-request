import { browserAdapter } from "./browserAdapter";
import { nodeAdapter } from "./nodeAdapter";
import { Adapter } from "./adapter";
export declare function getAdapter(): Adapter;
export { browserAdapter, nodeAdapter };
