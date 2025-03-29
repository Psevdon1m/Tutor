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
      v-if="shouldUpdatePreference"
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
      @click="savePreferences"
      :disabled="!user || isSubmitting"
    >
      {{ isSubmitting ? "Saving..." : "Subscribe to push notifications" }}
    </button>
    <button
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
      v-else
    >
      Go to questions
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Subject } from "~/types/db/subjects";
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
  if (submitForm.value.subjects === null) {
    submitForm.value.subjects = {};
  }
  if (submitForm.value.subjects[subject.id]) {
    debugger;
    delete submitForm.value.subjects[subject.id];
  } else {
    debugger;
    submitForm.value.subjects[subject.id] = true;
  }
};

const shouldUpdatePreference = computed(() => {
  const storedPrefs = userStore.getUserPreferences;
  if (!storedPrefs || !submitForm.value.subjects) {
    return false;
  }

  const currentKeys = Object.keys(submitForm.value.subjects);
  const savedKeys = storedPrefs.subjects;
  debugger;

  if (currentKeys.length !== savedKeys.length) {
    return true;
  }
  debugger;

  return currentKeys.some((key) => !savedKeys.includes(key));
});

interface Database {
  public: {
    Tables: {
      user_preferences: {
        Row: {
          user_id: string;
          subjects: string[];
          notification_frequency: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          subjects: string[];
          notification_frequency: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Fetch subjects when component mounts
onMounted(async () => {
  await subjectsStore.fetchSubjects();
  if (userPreferences.value && userPreferences.value.subjects) {
    submitForm.value.subjects = userPreferences.value.subjects.reduce(
      (acc, subjectId) => {
        acc[subjectId] = true;
        return acc;
      },
      {} as Record<string, boolean>
    );
  }
});

async function savePreferences() {
  if (!user.value) return;

  isSubmitting.value = true;
  try {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.value.id,
      subjects: submitForm.value.subjects,
      notification_frequency: submitForm.value.frequencies,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    console.log("Preferences saved successfully");
  } catch (err) {
    console.error("Error saving preferences:", err);
  } finally {
    isSubmitting.value = false;
  }
}
watch(
  user,
  () => {
    console.log("User changed:", user.value);

    if (user.value) {
      console.log("Fetching user preferences");
      userStore.fetchUserPreferences(user.value.id);
    }
  },
  { immediate: true }
);
</script>
