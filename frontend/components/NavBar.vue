<template>
  <nav class="bg-white shadow">
    <div class="max-w-6xl mx-auto px-4">
      <div class="flex justify-between h-16">
        <div class="flex">
          <NuxtLink to="/" class="flex-shrink-0 flex items-center">
            <h1 class="text-xl font-bold text-[#5e9f95]">Tutor</h1>
          </NuxtLink>
        </div>

        <div v-if="user" class="flex items-center">
          <NuxtLink
            to="/questions"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium relative"
          >
            Questions
            <span
              v-if="unreadCount > 0"
              class="absolute top-0 right-0 -mt-1 -mr-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white"
            >
              {{ unreadCount }}
            </span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
const user = useSupabaseUser();
const questionsStore = useQuestionsStore();
const unreadCount = computed(() => questionsStore.unreadCount);

onMounted(() => {
  if (user.value) {
    questionsStore.fetchQuestions();
  }
});
</script>
