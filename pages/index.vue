<template>
  <div class="p-6 max-w-md mx-auto min-h-screen">
    <!-- App Title -->
    <h1 class="text-4xl font-bold text-gray-900 mb-2">Tutor App</h1>

    <!-- Welcome Text -->
    <h2 class="text-3xl text-gray-800 mb-8">Welcome!</h2>

    <!-- Conditionally render either GoogleSignIn or UserProfile -->
    <UserProfile v-if="user" />
    <GoogleSignIn v-else />

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
import { useAuth } from "../composables/useAuth";
import GoogleSignIn from "../components/GoogleSignIn.vue";
import UserProfile from "../components/UserProfile.vue";

const subjects = ["Українська", "English", "TypeScript", "Node.JS"];
const frequencies = ["1 time", "2 times", "3 times"];
const selectedFrequency = ref("2 times");
const selectedSubjects = ref<string[]>([]);

const { signInWithGoogle } = useAuth();
const user = useSupabaseUser();

const handleSignIn = async () => {
  try {
    await signInWithGoogle();
  } catch (error) {
    console.error("Sign in error:", error);
  }
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
