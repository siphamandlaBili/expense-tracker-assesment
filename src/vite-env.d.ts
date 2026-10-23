/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the spending API, e.g. https://api.example.com. Defaults to /api. */
  readonly VITE_API_BASE_URL?: string;
  /** "true" serves all API calls from the in-browser MSW mock. */
  readonly VITE_ENABLE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
