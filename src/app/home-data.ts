import { hasSupabaseConfig } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type HomeGroup = Pick<
  Database["public"]["Tables"]["groups"]["Row"],
  | "id"
  | "name"
  | "invite_code"
  | "default_meeting_day"
  | "default_meeting_time"
  | "default_location_type"
  | "default_location_name"
  | "default_location_url"
  | "default_location_note"
>;

export type HomeData =
  | {
      configured: false;
      user: null;
      groups: HomeGroup[];
      error: null;
    }
  | {
      configured: true;
      user: { id: string; email: string | null };
      groups: HomeGroup[];
      error: string | null;
    }
  | {
      configured: true;
      user: null;
      groups: HomeGroup[];
      error: string | null;
    };

export async function getHomeData(): Promise<HomeData> {
  if (!hasSupabaseConfig()) {
    return {
      configured: false,
      user: null,
      groups: [],
      error: null,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      configured: true,
      user: null,
      groups: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id,name,invite_code,default_meeting_day,default_meeting_time,default_location_type,default_location_name,default_location_url,default_location_note",
    )
    .order("created_at", { ascending: true });

  return {
    configured: true,
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    groups: (data ?? []) as HomeGroup[],
    error: error ? "그룹 정보를 불러오지 못했습니다. Supabase migration 적용 여부를 확인해주세요." : null,
  };
}
