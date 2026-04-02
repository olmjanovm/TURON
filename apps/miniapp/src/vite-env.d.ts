/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_MAPS_PROVIDER?: 'yandex' | 'none';
  readonly VITE_MAP_API_KEY?: string;
  readonly VITE_MAP_LANGUAGE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
