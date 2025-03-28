<template>
  <div class="p-6 max-w-md mx-auto">
    <h1 class="text-4xl font-bold mb-4">Tutor App</h1>

    <h2 class="text-3xl mb-6">Welcome!</h2>

    <button
      @click="signInWithGoogle"
      class="w-full mb-8 flex items-center justify-center gap-2 border rounded-lg p-3 hover:bg-gray-50 transition-colors"
    >
      <img src="assets/icons/google-icon.svg" alt="Google" class="w-6 h-6" />
      <span class="text-lg">Sign in with Google</span>
    </button>

    <div class="space-y-6">
      <h2 class="text-2xl font-semibold">Subjects</h2>
      <div class="space-y-3">
        <button
          v-for="subject in subjects"
          :key="subject"
          class="w-full p-4 text-white text-xl rounded-lg transition-opacity"
          :class="subjectColors[subject as keyof typeof subjectColors]"
          @click="toggleSubject(subject)"
        >
          {{ subject }}
        </button>
      </div>

      <div class="mt-8">
        <h2 class="text-2xl font-semibold mb-4">Notification Frequency</h2>
        <div class="flex gap-3">
          <button
            v-for="freq in frequencies"
            :key="freq"
            @click="setFrequency(freq)"
            class="flex-1 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            :class="{ 'border-green-500': selectedFrequency === freq }"
          >
            {{ freq }}
          </button>
        </div>
      </div>

      <button
        class="w-full p-4 bg-teal-600 text-white rounded-lg text-xl hover:bg-teal-700 transition-colors"
      >
        Get Questions
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const subjects = ["Mathematics", "Biology", "History", "Physics"];
const frequencies = ["Hourly", "Daily", "Weekly"];

const subjectColors = {
  Mathematics: "bg-teal-600",
  Biology: "bg-green-400",
  History: "bg-teal-600",
  Physics: "bg-green-400",
};

const selectedSubjects = ref<string[]>([]);
const selectedFrequency = ref<string>("Daily");

const toggleSubject = (subject: string) => {
  const index = selectedSubjects.value.indexOf(subject);
  if (index === -1) {
    selectedSubjects.value.push(subject);
  } else {
    selectedSubjects.value.splice(index, 1);
  }
};

const setFrequency = (freq: string) => {
  selectedFrequency.value = freq;
};

const signInWithGoogle = async () => {
  // Will implement Supabase auth here
};
</script>
