<template>
  <h2 class="text-2xl font-semibold text-[#2a3538] mb-4 font-montserrat">
    Subjects
  </h2>
  <div class="space-y-3 mb-12">
    <button
      v-for="(subject, index) in props.subjects"
      :key="index"
      :class="[
        'w-full h-14 rounded-xl text-xl font-normal transition-opacity text-left pl-4',
        selectedSubjects.includes(subject.id)
          ? 'bg-[#5e9f95] text-white'
          : 'bg-[#b1d1b1]  text-[#062431]',
      ]"
      @click="toggleSubject(subject.id)"
    >
      {{ subject.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Subject } from "~/types/db/subjects";
import type { UserPreferences } from "~/types/db/preferences";
import { useUserStore } from "~/stores/userStore";
const userStore = useUserStore();
const userPreferences = computed(() => userStore.getUserPreferences);

const props = defineProps<{
  subjects: Subject[];
}>();
const emit = defineEmits<{
  (e: "toggle-subject", subjects: string[]): void;
}>();
const selectedSubjects = ref<string[]>([]);

onMounted(() => {
  if (userPreferences.value) {
    selectedSubjects.value = userPreferences.value.subjects;
  }
});

const toggleSubject = (subject: string) => {
  const index = selectedSubjects.value.indexOf(subject);
  if (index === -1) {
    selectedSubjects.value.push(subject);
  } else {
    selectedSubjects.value.splice(index, 1);
  }
  emit("toggle-subject", selectedSubjects.value);
};

watch(userPreferences, () => {
  if (userPreferences.value && selectedSubjects.value.length === 0) {
    selectedSubjects.value = userPreferences.value.subjects;
  }
});
</script>
