<template>
  <!-- Notification Frequency Section -->
  <h2 class="text-2xl font-semibold text-[#2a3538] mb-4 font-montserrat">
    Notifications per day
  </h2>
  <div class="flex gap-3 mb-8">
    <button
      v-for="freq in props.frequencies"
      :key="freq"
      class="flex-1 py-2 px-4 border-2 border-gray-400 rounded-xl hover:bg-gray-50 transition-colors text-xl"
      :class="{ 'border-gray-500 bg-gray-100': selectedFrequency === freq }"
      @click="
        selectedFrequency = freq;
        emit('selected-frequency', freq);
      "
    >
      {{ freq > 1 ? `${freq} times` : "1 time" }}
    </button>
  </div>
</template>

<script setup lang="ts">
const userStore = useUserStore();
const userPreferences = computed(() => userStore.getUserPreferences);
const props = defineProps<{
  frequencies: number[];
}>();

onMounted(() => {
  if (userPreferences.value) {
    selectedFrequency.value = userPreferences.value.notification_frequency;
  }
});
const emit = defineEmits<{
  (e: "selected-frequency", frequency: number): void;
}>();
const selectedFrequency = ref(2);

watch(userPreferences, () => {
  if (userPreferences.value) {
    selectedFrequency.value = userPreferences.value.notification_frequency;
  }
});
</script>
