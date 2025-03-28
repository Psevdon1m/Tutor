<template>
  <div class="p-6 max-w-md mx-auto min-h-screen">
    <!-- App Title -->
    <h1 class="text-4xl font-bold text-[#2a3538] mb-6 font-montserrat">
      Tutor App
    </h1>

    <!-- Welcome Text -->
    <h2 class="text-3xl text-[#2a3538] mb-4 font-montserrat">Welcome!</h2>

    <!-- Google Sign In Button -->
    <button
      class="w-full mb-4 h-14 flex items-center justify-center gap-3 bg-white border-2 border-gray-400 rounded-xl hover:bg-gray-50 transition-colors"
      @click="signInWithGoogle"
    >
      <img src="assets/icons/google-icon.svg" alt="Google" class="w-10 h-10" />
      <span
        class="text-3xl text-[#2a3538] font-montserrat p-0 w-65 text-center"
      >
        Sign in with Google
      </span>
    </button>

    <!-- Subjects Section -->
    <h2 class="text-2xl font-semibold text-[#2a3538] mb-4 font-montserrat">
      Subjects
    </h2>
    <div class="space-y-3 mb-12">
      <button
        v-for="(subject, index) in subjects"
        :key="index"
        :class="[
          'w-full h-14 rounded-xl text-xl font-normal transition-opacity text-left pl-4',
          selectedSubjects.includes(subject)
            ? 'bg-[#5e9f95] text-white'
            : 'bg-[#b1d1b1]  text-[#062431]',
        ]"
        @click="toggleSubject(subject)"
      >
        {{ subject }}
      </button>
    </div>

    <!-- Notification Frequency Section -->
    <h2 class="text-2xl font-semibold text-[#2a3538] mb-4 font-montserrat">
      Notifications per day
    </h2>
    <div class="flex gap-3 mb-8">
      <button
        v-for="freq in frequencies"
        :key="freq"
        class="flex-1 py-2 px-4 border-2 border-gray-400 rounded-xl hover:bg-gray-50 transition-colors text-xl"
        :class="{ 'border-gray-500 bg-gray-100': selectedFrequency === freq }"
        @click="selectedFrequency = freq"
      >
        {{ freq }}
      </button>
    </div>

    <!-- Get Questions Button -->
    <button
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
    >
      Get Questions
    </button>
  </div>
</template>

<script setup lang="ts">
const subjects = ["Українська", "English", "TypeScript", "Node.JS"];
const frequencies = ["1 time", "2 times", "3 times"];
const selectedFrequency = ref("2 times");
const selectedSubjects = ref<string[]>([]);

const signInWithGoogle = async () => {
  // Implement Google sign in
};

const toggleSubject = (subject: string) => {
  const index = selectedSubjects.value.indexOf(subject);
  if (index === -1) {
    selectedSubjects.value.push(subject);
  } else {
    selectedSubjects.value.splice(index, 1);
  }
};
</script>
