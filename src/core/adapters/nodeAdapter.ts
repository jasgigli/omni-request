// src/core/adapters/nodeAdapter.ts
import { RequestConfig } from "../../types/request";
import { ResponseData } from "../../types/response";
import { RequestError, ErrorType } from "../../types/error";
import * as http from "http";
import * as https from "https";

export async function nodeAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    try {
      if (!config.url) {
        throw new RequestError("URL is required", config, "VALIDATION_ERROR");
      }

      const parsedUrl = new URL(config.url);
      const isHttps = parsedUrl.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const {
        method = "GET",
        headers = {},
        data,
        timeout,
        responseType = "json",
        signal,
      } = config;

      // Handle content type for data requests
      if (
        ["POST", "PUT", "PATCH"].includes(method.toUpperCase()) &&
        data &&
        !headers["Content-Type"]
      ) {
        headers["Content-Type"] = "application/json";
      }

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: method.toUpperCase(),
        headers,
      };

      const req = httpModule.request(options, (res) => {
        const responseHeaders: Record<string, string> = {};
        Object.entries(res.headers).forEach(([key, value]) => {
          if (typeof value === "string") {
            responseHeaders[key] = value;
          }
        });

        let rawData = "";

        if (responseType === "arraybuffer" || responseType === "blob") {
          const chunks: Buffer[] = [];
          res.on("data", (chunk: Buffer) => chunks.push(chunk));
          res.on("end", () => {
            const buffer = Buffer.concat(chunks);
            const response: ResponseData = {
              data: buffer,
              status: res.statusCode || 0,
              statusText: res.statusMessage || "",
              headers: responseHeaders,
              config,
            };
            resolve(response);
          });
        } else {
          res.on("data", (chunk) => {
            rawData += chunk;
          });

          res.on("end", () => {
            try {
              let processedData: any = rawData;
              if (responseType === "json" && rawData) {
                processedData = JSON.parse(rawData);
              }

              const response: ResponseData = {
                data: processedData,
                status: res.statusCode || 0,
                statusText: res.statusMessage || "",
                headers: responseHeaders,
                config,
              };
              resolve(response);
            } catch (err) {
              reject(
                new RequestError(
                  `Error processing response: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`,
                  config,
                  "RESPONSE_PROCESSING_ERROR"
                )
              );
            }
          });
        }
      });

      req.on("error", (err) => {
        reject(
          new RequestError(
            `Network Error: ${err.message}`,
            config,
            "NETWORK_ERROR"
          )
        );
      });

      if (timeout) {
        req.setTimeout(timeout, () => {
          req.destroy();
          reject(
            new RequestError(
              `Timeout of ${timeout}ms exceeded`,
              config,
              "TIMEOUT"
            )
          );
        });
      }

      if (signal) {
        signal.addEventListener("abort", () => {
          req.destroy();
          reject(new RequestError("Request aborted", config, "CANCELED"));
        });
      }

      // Send data if present
      if (data) {
        const bodyData = typeof data === "string" ? data : JSON.stringify(data);
        req.write(bodyData);
      }

      req.end();
    } catch (err) {
      reject(
        new RequestError(
          `Request failed: ${
            err instanceof Error ? err.message : "Unknown error"
          }`,
          config,
          "NETWORK_ERROR"
        )
      );
    }
  });
}
