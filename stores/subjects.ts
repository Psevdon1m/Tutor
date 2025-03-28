import { defineStore } from "pinia";

import type { Subject } from "~/types/db/subjects";

export const useSubjectsStore = defineStore("subjects", {
  state: () => ({
    subjects: [] as Subject[],
    loading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSubjects() {
      const supabase = useSupabaseClient();
      this.loading = true;
      try {
        const { data, error } = await supabase.from("subjects").select("*");

        if (error) throw error;

        this.subjects = data;
      } catch (err: unknown) {
        this.error = err instanceof Error ? err.message : "Unknown error";
        console.error("Error loading subjects:", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
