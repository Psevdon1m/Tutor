<template>
  <div v-if="show" class="fixed inset-0 flex items-center justify-center z-50">
    <div
      class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md mx-auto backdrop-blur-md bg-opacity-70 border border-gray-200 dark:border-gray-700 backdrop-filter backdrop-blur-lg animate-gradient"
    >
      <h2 class="text-2xl font-semibold mb-4 text-[#062431]">
        {{ title }}
      </h2>
      <p class="mb-6 text-[#062431]">
        {{ message }}
      </p>
      <button
        @click="onAction"
        class="bg-[#5e9f95] hover:bg-green-700 text-[#062431] font-medium px-4 py-2 rounded transition duration-200"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  show: Boolean,
  title: String,
  message: String,
  buttonText: String,
});

const emit = defineEmits(["action"]);

const onAction = () => {
  emit("action");
};
</script>

<style scoped>
/* Glass effect with gradient animation */
.fixed {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.animate-gradient {
  background: linear-gradient(
    135deg,
    rgba(177, 209, 177, 1),
    rgba(255, 255, 255, 1)
  );
  background-size: 200% 200%;
  animation: gradientAnimation 5s ease infinite;
}

@keyframes gradientAnimation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
