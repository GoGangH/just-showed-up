import type { Database } from "@/lib/supabase/database.types";
import type { createClient } from "@/lib/supabase/server";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export type HeaderNotification = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "id" | "title" | "body" | "href" | "read_at" | "created_at" | "type"
>;

type NotifyGroupMembersInput = {
  actorId: string;
  body?: string | null;
  excludeUserIds?: string[];
  groupId: string;
  href: string;
  title: string;
  type: NotificationInsert["type"];
};

export async function getHeaderNotifications(supabase: AppSupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { notifications: [], unreadCount: 0 };
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,href,read_at,created_at,type")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    return { notifications: [], unreadCount: 0 };
  }

  const { count, error: unreadError } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  const notifications = (data ?? []) as HeaderNotification[];
  return {
    notifications,
    unreadCount: unreadError ? notifications.filter((notification) => !notification.read_at).length : count ?? 0,
  };
}

export async function notifyGroupMembers(
  supabase: AppSupabaseClient,
  input: NotifyGroupMembersInput,
) {
  const { data: memberRows, error: memberError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", input.groupId);

  if (memberError) return;

  const excluded = new Set(input.excludeUserIds ?? []);
  const notifications: NotificationInsert[] = ((memberRows ?? []) as { user_id: string }[])
    .filter((member) => !excluded.has(member.user_id))
    .map((member) => ({
      actor_id: input.actorId,
      body: input.body ?? null,
      group_id: input.groupId,
      href: input.href,
      title: input.title,
      type: input.type,
      user_id: member.user_id,
    }));

  if (notifications.length === 0) return;

  await supabase.from("notifications").insert(notifications as never);
}

export async function notifyUser(
  supabase: AppSupabaseClient,
  notification: NotificationInsert,
) {
  await supabase.from("notifications").insert(notification as never);
}
