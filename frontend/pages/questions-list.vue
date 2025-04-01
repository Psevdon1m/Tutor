<template>
  <div class="p-6 max-w-3xl mx-auto">
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">My Questions</h1>
        <button
          @click="goBack"
          class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          Back
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center my-12">
      <div
        class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <!-- No questions yet -->
    <div
      v-else-if="questions.length === 0"
      class="bg-white rounded-lg shadow-md p-8 text-center"
    >
      <img
        src="~/assets/images/empty-state.svg"
        alt="No questions yet"
        class="w-32 h-32 mx-auto mb-4"
      />
      <h2 class="text-xl font-medium text-gray-800 mb-2">No questions yet</h2>
      <p class="text-gray-600 mb-6">
        Questions will appear here based on your notification preferences.
      </p>
      <NuxtLink
        to="/"
        class="inline-block px-6 py-3 bg-[#5e9f95] text-white rounded-lg hover:bg-opacity-90 transition-colors"
      >
        Back to Settings
      </NuxtLink>
    </div>

    <!-- Questions list -->
    <div v-else class="space-y-6">
      <div
        v-for="question in questions"
        :key="question.id"
        class="bg-white rounded-lg shadow-md overflow-hidden"
        @click="navigateTo(`/questions/${question.id}`)"
      >
        <div class="p-6">
          <!-- Subject badge -->
          <div
            class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-4"
          >
            {{ question?.subject?.name || "Unknown Subject" }}
          </div>

          <!-- Question -->
          <h2 class="text-xl font-medium text-gray-800 mb-4">
            {{ question.question_text }}
          </h2>

          <!-- Toggle answer button -->
          <button
            @click.stop="toggleAnswer(question.id)"
            class="text-[#5e9f95] font-medium flex items-center"
          >
            {{ expandedAnswers[question.id] ? "Hide Answer" : "Show Answer" }}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 ml-1 transition-transform"
              :class="{ 'rotate-180': expandedAnswers[question.id] }"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>

          <!-- Answer (collapsible) -->
          <div
            v-if="expandedAnswers[question.id]"
            class="mt-4 pt-4 border-t border-gray-100"
          >
            <p class="text-gray-700 whitespace-pre-line">
              {{ question.answer_text }}
            </p>
          </div>
        </div>

        <div class="px-6 py-3 bg-gray-50 flex justify-between items-center">
          <span class="text-sm text-gray-500">{{
            formatDate(question.created_at)
          }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { Database } from "~/types/database";
import type { Question } from "~/types/db/question";

// State
const questions = ref<Question[]>([]);
const loading = ref(true);
const expandedAnswers = reactive<Record<string, boolean>>({});
const user = useSupabaseUser();
const supabase = useSupabaseClient<Database>();

// Fetch questions on mount
onMounted(async () => {
  if (!user.value) return;

  try {
    loading.value = true;

    // Fetch questions with subject information
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
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    questions.value = data as unknown as Question[];
  } catch (error) {
    console.error("Error fetching questions:", error);
  } finally {
    loading.value = false;
  }
});

// Toggle answer visibility
const toggleAnswer = (id: string) => {
  expandedAnswers[id] = !expandedAnswers[id];
};

// Mark question as read/unread
const markAsRead = async (id: string, read: boolean) => {
  try {
    const { error } = await supabase
      .from("questions")
      .update({ read })
      .eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error updating question:", error);
  }
};

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const goBack = () => {
  navigateTo("/");
};
</script>
