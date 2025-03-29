import { defineStore } from "pinia";

import type { UserPreferences } from "~/types/db/preferences";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    userPreferences: null as UserPreferences | null,
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchUserPreferences(user_id: string) {
      const supabase = useSupabaseClient();
      this.loading = true;
      try {
        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user_id);

        if (error) throw error;

        this.userPreferences = data[0] || null;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : "Unknown error";
        console.error("Error loading user preferences:", err);
      } finally {
        this.loading = false;
      }
    },
  },
  getters: {
    getUserPreferences: (state) =>
      state.userPreferences || {
        subjects: [],
        notification_frequency: null,
      },
  },
});
