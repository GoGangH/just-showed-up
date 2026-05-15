import { getCurrentWeekStart } from "@/lib/dates/week";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type AppSupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type AvailabilitySummary = {
  startsAt: string;
  count: number;
  selectedByMe: boolean;
};

export type RescheduleOverview = {
  availability: AvailabilitySummary[];
  reason: string | null;
  responderCount: number;
  scheduledAt: string | null;
  status: "none" | "scheduled" | "rescheduling" | "confirmed" | "cancelled" | "completed";
};

export async function getRescheduleOverview(
  groupId: string,
  options: { supabase?: AppSupabaseClient; userId?: string | null } = {},
): Promise<RescheduleOverview> {
  if (!hasSupabaseConfig()) {
    return { availability: [], reason: null, responderCount: 0, scheduledAt: null, status: "none" };
  }

  const supabase = options.supabase ?? await createClient();
  let userId = options.userId ?? null;

  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return { availability: [], reason: null, responderCount: 0, scheduledAt: null, status: "none" };

  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("id,status,reschedule_reason,scheduled_at")
    .eq("group_id", groupId)
    .eq("week_start", getCurrentWeekStart())
    .maybeSingle();

  const session = sessionData as {
    id: string;
    reschedule_reason: string | null;
    scheduled_at: string | null;
    status: RescheduleOverview["status"];
  } | null;
  if (!session) {
    return { availability: [], reason: null, responderCount: 0, scheduledAt: null, status: "none" };
  }

  const { data: slotRows } = await supabase
    .from("session_time_slots")
    .select("id,starts_at")
    .eq("session_id", session.id)
    .order("starts_at", { ascending: true });

  const slots = (slotRows ?? []) as { id: string; starts_at: string }[];
  if (slots.length === 0) {
    return {
      availability: [],
      reason: session.reschedule_reason,
      responderCount: 0,
      scheduledAt: session.scheduled_at,
      status: session.status,
    };
  }

  const slotIds = slots.map((slot) => slot.id);
  const [availabilityResult, responseResult] = await Promise.all([
    supabase
      .from("session_availabilities")
      .select("slot_id,user_id")
      .eq("session_id", session.id)
      .in("slot_id", slotIds),
    supabase
      .from("session_responses")
      .select("user_id")
      .eq("session_id", session.id),
  ]);

  const counts = new Map<string, number>();
  const mySlots = new Set<string>();
  const responders = new Set(
    ((responseResult.data ?? []) as { user_id: string }[]).map((response) => response.user_id),
  );

  ((availabilityResult.data ?? []) as { slot_id: string; user_id: string }[]).forEach((availability) => {
    counts.set(availability.slot_id, (counts.get(availability.slot_id) ?? 0) + 1);
    responders.add(availability.user_id);
    if (availability.user_id === userId) {
      mySlots.add(availability.slot_id);
    }
  });

  return {
    availability: slots.map((slot) => ({
      startsAt: slot.starts_at,
      count: counts.get(slot.id) ?? 0,
      selectedByMe: mySlots.has(slot.id),
    })),
    reason: session.reschedule_reason,
    responderCount: responders.size,
    scheduledAt: session.scheduled_at,
    status: session.status,
  };
}

export async function getRescheduleData(groupId: string): Promise<AvailabilitySummary[]> {
  const overview = await getRescheduleOverview(groupId);
  return overview.availability;
}
