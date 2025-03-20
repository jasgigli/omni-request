import type { RequestConfig } from "../types/request";
import type { ResponseData } from "../types/response";
import * as http from "http";
import * as https from "https";

export async function nodeAdapter(
  config: RequestConfig
): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    const { url, method = "GET", headers = {}, data } = config;
    const isHttps = url.startsWith("https");
    const client = isHttps ? https : http;

    const requestOptions = {
      method,
      headers: headers as http.OutgoingHttpHeaders,
    };

    const req = client.request(url, requestOptions, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        resolve({
          data: JSON.parse(responseData),
          status: res.statusCode || 200,
          statusText: res.statusMessage || "OK",
          headers: res.headers,
          config,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(typeof data === "object" ? JSON.stringify(data) : data);
    }

    req.end();
  });
}
