/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the spending API. Defaults to the hosted API (api/config.ts). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
