import { RequestConfig } from "../types/request";
import { ResponseData } from "../types/response";
import * as http from "http";
import * as https from "https";

export async function nodeAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    try {
      if (!config.url) {
        throw new Error("URL is required");
      }

      const url = new URL(config.url);
      const isHttps = url.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const requestOptions: http.RequestOptions = {
        method: config.method || "GET",
        headers: config.headers,
        timeout: config.timeout,
      };

      const req = httpModule.request(url, requestOptions, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          const responseHeaders: Record<string, string> = {};
          Object.entries(res.headers).forEach(([key, value]) => {
            if (key && value) {
              responseHeaders[key] = Array.isArray(value)
                ? value.join(", ")
                : value;
            }
          });

          const response: ResponseData = {
            data: tryParseJSON(data),
            status: res.statusCode || 500,
            statusText: res.statusMessage || "",
            headers: responseHeaders,
            config,
          };

          if (
            config.validateStatus?.(response.status) ??
            (response.status >= 200 && response.status < 300)
          ) {
            resolve(response);
          } else {
            reject(new Error(`Request failed with status ${response.status}`));
          }
        });
      });

      req.on("error", (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });

      if (config.data) {
        req.write(JSON.stringify(config.data));
      }

      req.end();

      if (config.signal) {
        config.signal.addEventListener("abort", () => {
          req.destroy();
          reject(new Error("Request aborted"));
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        reject(new Error(`Request failed: ${error.message}`));
      } else {
        reject(new Error("An unknown error occurred"));
      }
    }
  });
}

function tryParseJSON(data: string): any {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
