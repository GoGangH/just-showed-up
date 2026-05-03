import { getCurrentWeekStart } from "@/lib/dates/week";
import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AvailabilitySummary = {
  startsAt: string;
  count: number;
  selectedByMe: boolean;
};

export async function getRescheduleData(groupId: string): Promise<AvailabilitySummary[]> {
  if (!hasSupabaseConfig()) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: sessionData } = await supabase
    .from("study_sessions")
    .select("id")
    .eq("group_id", groupId)
    .eq("week_start", getCurrentWeekStart())
    .maybeSingle();

  const session = sessionData as { id: string } | null;
  if (!session) return [];

  const { data: slotRows } = await supabase
    .from("session_time_slots")
    .select("id,starts_at")
    .eq("session_id", session.id)
    .order("starts_at", { ascending: true });

  const slots = (slotRows ?? []) as { id: string; starts_at: string }[];
  if (slots.length === 0) return [];

  const slotIds = slots.map((slot) => slot.id);
  const { data: availabilityRows } = await supabase
    .from("session_availabilities")
    .select("slot_id,user_id")
    .eq("session_id", session.id)
    .in("slot_id", slotIds);

  const counts = new Map<string, number>();
  const mySlots = new Set<string>();

  ((availabilityRows ?? []) as { slot_id: string; user_id: string }[]).forEach((availability) => {
    counts.set(availability.slot_id, (counts.get(availability.slot_id) ?? 0) + 1);
    if (availability.user_id === user.id) {
      mySlots.add(availability.slot_id);
    }
  });

  return slots.map((slot) => ({
    startsAt: slot.starts_at,
    count: counts.get(slot.id) ?? 0,
    selectedByMe: mySlots.has(slot.id),
  }));
}
