/// <reference types="vite-plus/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_DEV_SUPABASE_REDIRECT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
