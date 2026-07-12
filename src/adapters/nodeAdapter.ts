import * as http from "http";
import * as https from "https";
import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import { RequestError, ErrorType } from "../types/error";
import type { Adapter } from "./adapter";

export const nodeAdapter: Adapter = {
  async request(config: RequestConfig): Promise<ResponseData> {
    return new Promise((resolve, reject) => {
      try {
        if (!config.url) {
          reject(
            new RequestError({
              message: "URL is required",
              config,
              type: ErrorType.VALIDATION,
              status: 0,
            })
          );
          return;
        }

        const parsedUrl = new URL(config.url);
        const isHttps = parsedUrl.protocol === "https:";
        const httpModule = isHttps ? https : http;

        const {
          method = "GET",
          headers = {},
          data,
          timeout,
          signal,
        } = config;

        if (
          ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
          data &&
          !headers["Content-Type"]
        ) {
          headers["Content-Type"] = "application/json";
        }

        const requestOptions = {
          method: method.toUpperCase(),
          headers,
          timeout,
        };

        const req = httpModule.request(parsedUrl, requestOptions, (res) => {
          let responseData = "";

          res.on("data", (chunk) => {
            responseData += chunk;
          });

          res.on("end", () => {
            let parsedData;
            
            // Handle 204 No Content responses
            if (res.statusCode === 204) {
              parsedData = null;
            } else {
              try {
                parsedData = responseData ? JSON.parse(responseData) : null;
              } catch {
                parsedData = responseData;
              }
            }

            // Throw error for non-2xx status codes
            if (res.statusCode && res.statusCode >= 400) {
              reject(
                new RequestError({
                  message: `Request failed with status ${res.statusCode}`,
                  config,
                  type: ErrorType.SERVER,
                  status: res.statusCode,
                  response: parsedData,
                })
              );
              return;
            }

            resolve({
              data: parsedData,
              status: res.statusCode || 200,
              statusText: res.statusMessage || "OK",
              headers: Object.fromEntries(
                Object.entries(res.headers).map(([key, value]) => [
                  key,
                  Array.isArray(value) ? value.join(", ") : value || "",
                ])
              ),
              config,
            });
          });
        });

        req.on("error", (error) => {
          reject(
            new RequestError({
              message: `Network Error: ${error.message}`,
              config,
              type: ErrorType.NETWORK,
              status: 0,
            })
          );
        });

        if (timeout) {
          req.setTimeout(timeout, () => {
            req.destroy();
            reject(
              new RequestError({
                message: `Timeout of ${timeout}ms exceeded`,
                config,
                type: ErrorType.TIMEOUT,
                status: 0,
              })
            );
          });
        }

        if (signal) {
          signal.addEventListener("abort", () => {
            req.destroy();
            reject(
              new RequestError({
                message: "Request aborted",
                config,
                type: ErrorType.CANCELED,
                status: 0,
              })
            );
          });
        }

        if (data) {
          const bodyData = typeof data === "string" ? data : JSON.stringify(data);
          req.write(bodyData);
        }

        req.end();
      } catch (err) {
        reject(
          new RequestError({
            message: `Request failed: ${
              err instanceof Error ? err.message : "Unknown error"
            }`,
            config,
            type: ErrorType.REQUEST,
            status: 0,
          })
        );
      }
    });
  }
};
