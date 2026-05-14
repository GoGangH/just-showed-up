"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/env";

export async function markAllNotificationsReadAction() {
  if (!hasSupabaseConfig()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() } as never)
    .eq("user_id", user.id)
    .is("read_at", null);

  revalidatePath("/");
}
