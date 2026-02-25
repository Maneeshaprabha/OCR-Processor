import { createBrowserClient } from "@supabase/ssr";

export function getSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        fetch: (url, options) => {
          const cleanOptions = { ...options };
          delete cleanOptions?.signal;
          return fetch(url, cleanOptions);
        }
      }
    }
  );
}