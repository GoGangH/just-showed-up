import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { requireSupabaseConfig } from "./env";

export function createClient() {
  const { url, anonKey } = requireSupabaseConfig();
  return createBrowserClient<Database>(url, anonKey);
}
