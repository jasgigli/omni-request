import { RequestError } from "./error";
export interface RetryOptions {
    attempts: number;
    backoff: "exponential" | "linear" | "fixed";
    conditions: Array<(error: RequestError) => boolean>;
}
