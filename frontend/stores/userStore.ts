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
      const config = useRuntimeConfig();
      const isLocalhost = config.public.mode === "localhost";
      try {
        await $fetch(
          isLocalhost
            ? "http://localhost:3001/api/update-notification-schedule"
            : "https://tutor-production-a449.up.railway.app/api/update-notification-schedule",
          {
            method: "POST",
            body: JSON.stringify({ user_id }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error updating cron jobs:", error);
      }
    },
    async requireFirstNotification(user_id: string) {
      const config = useRuntimeConfig();
      const isLocalhost = config.public.mode === "localhost";
      console.log({ isLocalhost });
      try {
        const time = getTimeInSeconds(1);
        await $fetch(
          isLocalhost
            ? "http://localhost:3001/api/require-first-notification"
            : "https://tutor-production-a449.up.railway.app/api/require-first-notification",
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

    async pregenerateQuestion(
      user_id: string,
      subject_id: string,
      subject: string
    ) {
      const config = useRuntimeConfig();
      const isLocalhost = config.public.mode === "localhost";
      console.log({ isLocalhost });
      try {
        await $fetch(
          isLocalhost
            ? "http://localhost:3001/api/pre-generate-response-from-openai"
            : "https://tutor-production-a449.up.railway.app/api/pre-generate-response-from-openai",
          {
            method: "POST",
            body: JSON.stringify({
              user_id,
              subject_id,
              subject: subject === "Українська" ? "Ukrainian" : subject,
            }),
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      } catch (error) {
        console.error("Error pregenerating question:", error);
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
