import { createBrowserClient } from "@supabase/ssr";

let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (clientInstance) return clientInstance;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a minimal mock so SSR/static builds don't crash.
    // Real values must be provided at runtime.
    return {
      auth: {
        signInWithOtp: async () => ({ error: new Error("Supabase not configured") }),
        signInWithOAuth: async () => ({ error: new Error("Supabase not configured") }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
      },
    } as unknown as ReturnType<typeof createBrowserClient>;
  }

  clientInstance = createBrowserClient(url, key);
  return clientInstance;
}
