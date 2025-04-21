<template>
  <h2 class="text-2xl font-semibold text-[#2a3538] mb-4 font-montserrat">
    Subjects
  </h2>
  <div
    class="h-[33vh] min-h-[200px] max-h-[600px] overflow-y-auto space-y-3 mb-6 pr-2"
  >
    <!-- Show placeholders when loading -->
    <div
      v-if="!props.subjects.length"
      v-for="i in 7"
      :key="i"
      class="w-full h-14 rounded-xl bg-gray-200 animate-pulse"
    />

    <!-- Show actual subjects when loaded -->
    <button
      v-else
      v-for="(subject, index) in props.subjects"
      :key="index"
      :class="[
        'w-full h-14 rounded-xl text-xl font-normal transition-opacity text-left pl-4',
        selectedSubjects.includes(subject.id)
          ? 'bg-[#5e9f95] text-white'
          : 'bg-[#b1d1b1] text-[#062431]',
      ]"
      @click="toggleSubject(subject.id)"
    >
      {{ subject.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Subject } from "~/types/db/subjects";
import { useUserStore } from "~/stores/userStore";
const userStore = useUserStore();
const userPreferences = computed(() => userStore.getUserPreferences);

const props = defineProps<{
  subjects: Subject[];
}>();
const emit = defineEmits<{
  (e: "toggle-subject", subject: Subject): void;
}>();
const selectedSubjects = ref<string[]>([]);

onMounted(() => {
  if (userPreferences.value) {
    selectedSubjects.value = [...userPreferences.value.subjects];
  }
});

const toggleSubject = (subjectId: string) => {
  const index = selectedSubjects.value.indexOf(subjectId);
  if (index === -1) {
    selectedSubjects.value.push(subjectId);
  } else {
    selectedSubjects.value.splice(index, 1);
  }
  const subject = props.subjects.find((s) => s.id === subjectId);
  if (subject) {
    emit("toggle-subject", subject);
  }
};

watch(userPreferences, () => {
  if (userPreferences.value && selectedSubjects.value.length === 0) {
    selectedSubjects.value = [...userPreferences.value.subjects];
  }
});
</script>
