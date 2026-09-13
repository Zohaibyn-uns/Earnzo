/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_PLATFORM_NAME: string;
  readonly VITE_PLATFORM_TAGLINE: string;
  readonly VITE_MEMBERSHIP_PRICE: string;
  readonly VITE_MIN_WITHDRAWAL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
