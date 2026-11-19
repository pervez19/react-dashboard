// Single place that touches import.meta.env (Jest maps this module to a mock).
const baseUrl = import.meta.env.VITE_API_BASE_URL;
if (!baseUrl) throw new Error('VITE_API_BASE_URL is not configured');
if (import.meta.env.PROD && !baseUrl.startsWith('https://')) {
  throw new Error('VITE_API_BASE_URL must use HTTPS in production');
}

// The gateway rejects every request without it, so fail fast instead of a wall of 401s.
const gatewayApiKey = import.meta.env.VITE_GATEWAY_API_KEY;
if (!gatewayApiKey) throw new Error('VITE_GATEWAY_API_KEY is not configured');

export const env = {
  apiBaseUrl: baseUrl,
  apiTimeoutMs: Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 15000),
  gatewayApiKey,
  isProd: import.meta.env.PROD,
} as const;
