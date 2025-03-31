<template>
  <div class="p-6 max-w-3xl mx-auto">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center my-12">
      <div
        class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
      ></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 p-4 rounded-lg">
      <p class="text-red-800">{{ error }}</p>
      <button
        @click="fetchQuestion"
        class="mt-2 text-red-600 hover:text-red-800"
      >
        Try again
      </button>
    </div>

    <!-- Question detail -->
    <div
      v-else-if="question"
      class="bg-white rounded-lg shadow-md overflow-hidden"
    >
      <div class="p-6">
        <!-- Back button -->
        <NuxtLink
          to="/questions"
          class="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
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
          Back to Questions
        </NuxtLink>

        <!-- Subject badge -->
        <div
          class="inline-block px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 mb-4"
        >
          {{ question.subject.name }}
        </div>

        <!-- Question -->
        <h1 class="text-2xl font-bold text-gray-900 mb-6">
          {{ question.question_text }}
        </h1>

        <!-- Answer -->
        <div class="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 class="text-lg font-medium text-gray-800 mb-2">Answer:</h2>
          <p class="text-gray-700 whitespace-pre-line">
            {{ question.answer_text }}
          </p>
        </div>

        <!-- Date -->
        <div class="text-sm text-gray-500">
          Added on {{ formatDate(question.created_at) }}
        </div>
      </div>
    </div>

    <!-- Not found -->
    <div v-else class="bg-white rounded-lg shadow-md p-8 text-center">
      <h2 class="text-xl font-medium text-gray-800 mb-2">Question not found</h2>
      <NuxtLink to="/questions" class="text-[#5e9f95] hover:underline">
        Back to Questions
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Question } from "~/types/db/question";
const route = useRoute();
const id = route.params.id as string;
const questionsStore = useQuestionsStore();
const loading = ref(true);
const error = ref<string | null>(null);
const question = ref<Question | null>(null);

const fetchQuestion = async () => {
  loading.value = true;
  error.value = null;

  try {
    const result = await questionsStore.fetchQuestionById(id);
    question.value = result;
  } catch (err: any) {
    error.value =
      err instanceof Error ? err.message : "Failed to load question";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchQuestion();
});

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};
</script>
