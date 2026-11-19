/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT_MS?: string;
  /** Identifies this app to the API gateway (header `gatewayKey`). Public: it ships in the bundle. */
  readonly VITE_GATEWAY_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
