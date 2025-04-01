<template>
  <div class="p-6 max-w-md mx-auto min-h-screen">
    <!-- App Title -->
    <h1 class="text-4xl font-bold text-gray-900 mb-2">Tutor App</h1>

    <!-- Welcome Text -->
    <h2 class="text-3xl text-gray-800 mb-8">Welcome!</h2>

    <!-- Conditionally render either GoogleSignIn or UserProfile -->
    <UserProfile v-if="user" />
    <GoogleSignIn v-else />

    <SubjectsList
      :subjects="subjectsStore.subjects"
      @toggle-subject="toggleSubject"
    />

    <NotificationSelector
      :frequencies="frequencies"
      @selected-frequency="submitForm.frequencies = $event"
    />

    <!-- Get Questions Button -->
    <button
      v-if="
        shouldUpdatePreference ||
        shouldUpdateFrequency ||
        userStore.getUserPreferences?.subjects.length === 0
      "
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
      @click="savePreferences"
      :disabled="!user || isSubmitting"
    >
      {{ isSubmitting ? "Saving..." : buttonText }}
    </button>
    <button
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
      v-else
    >
      <NuxtLink to="/questions-list"> Go to questions </NuxtLink>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Subject } from "~/types/db/subjects";
import type { Database } from "~/types/database";
import GoogleSignIn from "../components/GoogleSignIn.vue";
import UserProfile from "../components/UserProfile.vue";
import { useSubjectsStore } from "~/stores/subjects";
import { useUserStore } from "~/stores/userStore";

const submitForm = ref({
  subjects: null as Record<string, boolean> | null,
  frequencies: null as number | null,
});

const subjectsStore = useSubjectsStore();
const userStore = useUserStore();
const userPreferences = computed(() => userStore.getUserPreferences);
const frequencies = [1, 2, 3];
const user = useSupabaseUser();

const supabase = useSupabaseClient<Database>();
const isSubmitting = ref(false);

const toggleSubject = (subject: Subject) => {
  debugger;
  if (submitForm.value.subjects === null) {
    submitForm.value.subjects = {};
  }
  if (submitForm.value.subjects[subject.id]) {
    delete submitForm.value.subjects[subject.id];
  } else {
    submitForm.value.subjects[subject.id] = true;
  }
};

const buttonText = computed(() => {
  if (userStore.getUserPreferences?.subjects.length === 0) {
    return `Subscribe to push notifications`;
  }
  if (shouldUpdatePreference.value) {
    return `Update subjects`;
  }
  if (
    userStore.getUserPreferences?.notification_frequency &&
    submitForm.value.frequencies !==
      userStore.getUserPreferences?.notification_frequency
  ) {
    return `Update frequency`;
  }
  return `Go to questions`;
});

const shouldUpdatePreference = computed(() => {
  const storedPrefs = userStore.getUserPreferences;
  if (!storedPrefs || !submitForm.value.subjects) {
    return false;
  }

  const currentKeys = new Set(Object.keys(submitForm.value.subjects));
  const savedKeys = new Set(storedPrefs.subjects);

  return (
    currentKeys.size !== savedKeys.size ||
    [...currentKeys].some((key) => !savedKeys.has(key))
  );
});

const shouldUpdateFrequency = computed(() => {
  const storedPrefs = userStore.getUserPreferences;
  if (!storedPrefs || !submitForm.value.frequencies) {
    return false;
  }

  return submitForm.value.frequencies !== storedPrefs.notification_frequency;
});

const updateCurrentUserSubjects = () => {
  if (userPreferences.value && userPreferences.value.subjects) {
    console.log("User preferences found ", userPreferences.value);
    submitForm.value.subjects = userPreferences.value.subjects.reduce(
      (acc: Record<string, boolean>, subjectId: string) => {
        acc[subjectId] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
    console.log({
      formSubj: submitForm.value.subjects,
      storeSubj: userPreferences.value.subjects,
    });
    submitForm.value.frequencies = userPreferences.value.notification_frequency;
  } else {
    console.log("No user preferences found");
  }
};

// Fetch subjects when component mounts
onMounted(async () => {
  await subjectsStore.fetchSubjects();
  nextTick(() => {
    updateCurrentUserSubjects();
  });
});

async function savePreferences() {
  if (!user.value) return;

  isSubmitting.value = true;
  try {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.value.id,
      subjects: Object.keys(submitForm.value.subjects || []),
      notification_frequency: submitForm.value.frequencies,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    console.log("Preferences saved successfully");
    userStore.fetchUserPreferences(user.value.id);
    userStore.updateCronJobs(user.value.id);
  } catch (err) {
    console.error("Error saving preferences:", err);
  } finally {
    isSubmitting.value = false;
  }
}
watch(
  user,
  (newUser, oldUser) => {
    if (newUser?.id !== oldUser?.id && newUser) {
      console.log("User changed, fetching preferences");
      userStore.fetchUserPreferences(newUser.id);
    }
  },
  { immediate: true }
);
</script>
