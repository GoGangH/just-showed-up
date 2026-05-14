import type { User } from "@supabase/supabase-js";
import type { createClient } from "@/lib/supabase/server";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export function getProfileDisplayName(user: User) {
  return (
    String(user.user_metadata.name ?? user.user_metadata.full_name ?? user.user_metadata.nickname ?? "")
      .trim() ||
    user.email?.split("@")[0] ||
    "사용자"
  );
}

export async function syncProfileFromUser(supabase: AppSupabaseClient, user: User) {
  await supabase.from("profiles").upsert({
    id: user.id,
    nickname: getProfileDisplayName(user).slice(0, 30),
  } as never);
}
