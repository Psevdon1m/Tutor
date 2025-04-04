import { defineStore } from "pinia";
import { getTimeInSeconds } from "~/utils/helper";
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
    async updateCronJobs(user_id: string) {
      try {
        const result = await fetch(
          "https://tutor-production-a449.up.railway.app/api/update-notification-schedule",
          {
            method: "POST",
            body: JSON.stringify({ user_id }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        const data = await result.json();
        console.log(data);
      } catch (error) {
        console.error("Error updating cron jobs:", error);
      }
    },
    async requireFirstNotification(user_id: string) {
      try {
        const time = getTimeInSeconds(1);
        const result = await fetch(
          "https://tutor-production-a449.up.railway.app/api/require-first-notification",
          {
            method: "POST",
            body: JSON.stringify({ user_id, time }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error requiring first notification:", error);
      }
    },
    resetUserPreferences() {
      this.userPreferences = null;
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
