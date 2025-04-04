<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="show"
      class="fixed top-4 left-4 max-w-sm w-90 bg-white shadow-lg rounded-lg pointer-events-auto ring-2 ring-gray-400 ring-opacity-5 overflow-hidden z-50 hover:cursor-pointer"
      @click.stop="openQuestion"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <img
              class="h-10 w-10 rounded-full"
              src="/android-chrome-192x192.png"
              alt="Tutor"
            />
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ title }}
            </p>
            <p class="mt-1 text-sm text-gray-500">
              {{ body }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0 flex">
            <button
              @click.stop="closeNotification"
              class="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span class="sr-only">Close</span>
              <svg
                class="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
  body: string;
  show: boolean;
  data?: any;
}>();

const emit = defineEmits(["close"]);
const openQuestion = () => {
  if (props.data.question_id) {
    navigateTo("/questions/" + props.data.question_id);
  } else {
    closeNotification();
  }
};
const closeNotification = () => {
  emit("close");
};
</script>
