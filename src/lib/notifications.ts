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

type NotifyGroupOwnersInput = Omit<NotifyGroupMembersInput, "excludeUserIds"> & {
  excludeUserIds?: string[];
};

export async function getHeaderNotifications(supabase: AppSupabaseClient, userId?: string | null) {
  if (!userId) {
    return { notifications: [], unreadCount: 0 };
  }

  const listResult = await supabase
    .from("notifications")
    .select("id,title,body,href,read_at,created_at,type")
    .eq("user_id", userId)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(10);

  if (listResult.error) {
    return { notifications: [], unreadCount: 0 };
  }

  const notifications = (listResult.data ?? []) as HeaderNotification[];
  return {
    notifications,
    unreadCount: notifications.filter((notification) => !notification.read_at).length,
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

  if (memberError) {
    console.error("Failed to load notification recipients", memberError);
    return;
  }

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

  const { error } = await supabase.from("notifications").insert(notifications as never);
  if (error) {
    console.error("Failed to create group notifications", error);
  }
}

export async function notifyGroupOwners(
  supabase: AppSupabaseClient,
  input: NotifyGroupOwnersInput,
) {
  const { data: memberRows, error: memberError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", input.groupId)
    .eq("role", "owner");

  if (memberError) {
    console.error("Failed to load notification owner recipients", memberError);
    return;
  }

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

  const { error } = await supabase.from("notifications").insert(notifications as never);
  if (error) {
    console.error("Failed to create owner notifications", error);
  }
}

export async function notifyUser(
  supabase: AppSupabaseClient,
  notification: NotificationInsert,
) {
  const { error } = await supabase.from("notifications").insert(notification as never);
  if (error) {
    console.error("Failed to create user notification", error);
  }
}
