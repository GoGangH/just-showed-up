import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidateAppShell } from "@/lib/cache/revalidation";
import { hasSupabaseConfig } from "@/lib/supabase/env";

type NotificationRouteProps = {
  params: Promise<{
    notificationId: string;
  }>;
};

function safeInternalHref(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

export async function GET(_: Request, { params }: NotificationRouteProps) {
  if (!hasSupabaseConfig()) {
    redirect("/");
  }

  const { notificationId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data } = await supabase
    .from("notifications")
    .select("href,read_at")
    .eq("id", notificationId)
    .eq("user_id", user.id)
    .single();

  const notification = data as { href: string; read_at: string | null } | null;

  if (!notification) {
    redirect("/");
  }

  if (!notification.read_at) {
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() } as never)
      .eq("id", notificationId)
      .eq("user_id", user.id);
    revalidateAppShell();
  }

  redirect(safeInternalHref(notification.href) as Parameters<typeof redirect>[0]);
}
