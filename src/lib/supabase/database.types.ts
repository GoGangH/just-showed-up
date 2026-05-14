export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          created_at?: string;
        };
        Update: {
          nickname?: string;
        };
      };
      groups: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          default_meeting_day: number | null;
          default_meeting_time: string | null;
          default_location_type: "online" | "offline" | "hybrid" | "unset";
          default_location_name: string | null;
          default_location_url: string | null;
          default_location_note: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          default_meeting_day?: number | null;
          default_meeting_time?: string | null;
          default_location_type?: "online" | "offline" | "hybrid" | "unset";
          default_location_name?: string | null;
          default_location_url?: string | null;
          default_location_note?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["groups"]["Row"]>;
      };
      group_members: {
        Row: {
          group_id: string;
          user_id: string;
          role: "owner" | "member";
          joined_at: string;
        };
        Insert: {
          group_id: string;
          user_id?: string;
          role?: "owner" | "member";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "member";
        };
      };
      study_sessions: {
        Row: {
          id: string;
          group_id: string;
          week_start: string;
          scheduled_at: string | null;
          status: "scheduled" | "rescheduling" | "confirmed" | "cancelled" | "completed";
          location_type: "online" | "offline" | "hybrid" | "unset";
          location_name: string | null;
          location_url: string | null;
          location_note: string | null;
          reschedule_requested_by: string | null;
          reschedule_reason: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]> & {
          group_id: string;
          week_start: string;
        };
        Update: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]>;
      };
      session_time_slots: {
        Row: {
          id: string;
          session_id: string;
          starts_at: string;
          ends_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          starts_at: string;
          ends_at: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["session_time_slots"]["Row"]>;
      };
      session_availabilities: {
        Row: {
          session_id: string;
          slot_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          session_id: string;
          slot_id: string;
          user_id?: string;
          created_at?: string;
        };
        Update: never;
      };
      weekly_posts: {
        Row: {
          id: string;
          group_id: string;
          session_id: string | null;
          author_id: string;
          week_start: string;
          title: string;
          body_markdown: string;
          feedback_question: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          session_id?: string | null;
          author_id?: string;
          week_start: string;
          title: string;
          body_markdown: string;
          feedback_question?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_posts"]["Row"]>;
      };
      post_links: {
        Row: {
          id: string;
          post_id: string;
          url: string;
          title: string | null;
          description: string | null;
          image_url: string | null;
          site_name: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["post_links"]["Row"]> & {
          post_id: string;
          url: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_links"]["Row"]>;
      };
      post_attachments: {
        Row: {
          id: string;
          post_id: string;
          file_path: string;
          file_name: string;
          file_type: string;
          file_size: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["post_attachments"]["Row"]> & {
          post_id: string;
          file_path: string;
          file_name: string;
          file_type: string;
          file_size: number;
        };
        Update: never;
      };
      anonymous_comments: {
        Row: {
          id: string;
          post_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          body: string;
          created_at?: string;
        };
        Update: never;
      };
      anonymous_reactions: {
        Row: {
          id: string;
          post_id: string;
          reaction_type: "helpful" | "relate" | "cheer" | "curious" | "join";
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          reaction_type: "helpful" | "relate" | "cheer" | "curious" | "join";
          created_at?: string;
        };
        Update: never;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          group_id: string | null;
          actor_id: string | null;
          type:
            | "weekly_post_created"
            | "anonymous_comment_created"
            | "reschedule_vote_needed"
            | "schedule_confirmed";
          title: string;
          body: string | null;
          href: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          group_id?: string | null;
          actor_id?: string | null;
          type:
            | "weekly_post_created"
            | "anonymous_comment_created"
            | "reschedule_vote_needed"
            | "schedule_confirmed";
          title: string;
          body?: string | null;
          href: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      join_group_by_code: {
        Args: { code: string };
        Returns: string;
      };
      leave_group: {
        Args: { target_group_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
