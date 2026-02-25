// lib/supabaseClient.js
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    global: {
      fetch: (url, options) => {
        const cleanOptions = { ...options };
        delete cleanOptions.signal;
        return fetch(url, cleanOptions);
      }
    }
  }
);

export default supabase;