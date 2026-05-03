export function getSupabaseConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export function hasSupabaseConfig() {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
}

export function requireSupabaseConfig() {
  const config = getSupabaseConfig();

  if (!config.url || !config.anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url: config.url,
    anonKey: config.anonKey,
  };
}
