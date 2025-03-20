import { Plugin } from "../../core/plugin/pluginManager";
import { createHash, createHmac } from 'crypto';

export class SecurityEnhancerPlugin implements Plugin {
  name = "securityEnhancer";
  enabled = true;
  private options: SecurityOptions;

  constructor(options: SecurityOptions) {
    this.options = options;
  }

  async onRequest(config: RequestConfig): Promise<RequestConfig> {
    // Add request signing
    if (this.options.signing) {
      config = await this.signRequest(config);
    }

    // Add encryption
    if (this.options.encryption) {
      config = await this.encryptRequest(config);
    }

    // Add security headers
    config.headers = {
      ...config.headers,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      ...this.options.securityHeaders
    };

    return config;
  }

  private async signRequest(config: RequestConfig): Promise<RequestConfig> {
    const timestamp = Date.now().toString();
    const payload = `${config.method}${config.url}${timestamp}`;
    
    const signature = createHmac('sha256', this.options.signing.secretKey)
      .update(payload)
      .digest('hex');

    return {
      ...config,
      headers: {
        ...config.headers,
        'X-Timestamp': timestamp,
        'X-Signature': signature
      }
    };
  }

  private async encryptRequest(config: RequestConfig): Promise<RequestConfig> {
    if (!config.data) return config;

    const encrypted = await this.options.encryption.encrypt(
      JSON.stringify(config.data)
    );

    return {
      ...config,
      data: encrypted,
      headers: {
        ...config.headers,
        'Content-Type': 'application/encrypted+json'
      }
    };
  }
}