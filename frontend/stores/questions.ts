import { defineStore } from "pinia";
import type { Database } from "~/types/database";

import type { Question } from "~/types/db/question";

export const useQuestionsStore = defineStore("questions", {
  state: () => ({
    questions: [] as Question[],
    loading: false,
    error: null as string | null,
    unreadCount: 0,
  }),

  actions: {
    async fetchQuestions() {
      const supabase = useSupabaseClient<Database>();
      const user = useSupabaseUser();

      if (!user.value) return;

      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from("questions")
          .select(
            `
              *,
              subject:subject_id (
                id,
                name
              )
            `
          )
          .eq("user_id", user.value.id)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        this.questions = data as unknown as Question[];
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Failed to load questions";
        console.error("Error loading questions:", err);
      } finally {
        this.loading = false;
      }
    },

    async markAsRead(id: string, read: boolean) {
      const supabase = useSupabaseClient<Database>();

      try {
        const { error } = await supabase
          .from("questions")
          .update({ read })
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Error updating question:", error);
      }
    },

    async fetchQuestionById(id: string) {
      // Check if we already have it
      const existing = this.questions.find((q) => q.id === id);
      if (existing) return existing;

      const supabase = useSupabaseClient<Database>();

      try {
        const { data, error } = await supabase
          .from("questions")
          .select(
            `
              *,
              subject:subject_id (
                id,
                name
              )
            `
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        // Add to questions if not already there
        if (!this.questions.some((q) => q.id === data.id)) {
          this.questions.push(data as unknown as Question);
        }

        return data as unknown as Question;
      } catch (error) {
        console.error("Error fetching question:", error);
        return null;
      }
    },
  },
  getters: {
    getQuestionById: (state) => (id: string) => {
      return state.questions.find((q) => q.id === id);
    },
    getQuestions: (state) => state.questions,
  },
});
