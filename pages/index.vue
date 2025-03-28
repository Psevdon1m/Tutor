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
      @toggle-subject="submitForm.subjects = $event"
    />

    <NotificationSelector
      :frequencies="frequencies"
      @selected-frequency="submitForm.frequencies = $event"
    />

    <!-- Get Questions Button -->
    <button
      class="w-full h-14 bg-[#5e9f95] text-white text-xl rounded-2xl hover:opacity-90 transition-opacity"
      @click="savePreferences"
      :disabled="!user || isSubmitting"
    >
      {{ isSubmitting ? "Saving..." : "Subscribe to push notifications" }}
    </button>
  </div>
</template>

<script setup lang="ts">
import GoogleSignIn from "../components/GoogleSignIn.vue";
import UserProfile from "../components/UserProfile.vue";
import { useSubjectsStore } from "~/stores/subjects";
import { useUserStore } from "~/stores/userStore";
import type { AuthUser } from "@supabase/supabase-js";
const submitForm = {
  subjects: [] as string[],
  frequencies: 2,
};

const subjectsStore = useSubjectsStore();
const userStore = useUserStore();
const frequencies = [1, 2, 3];
const user = useSupabaseUser();

const supabase = useSupabaseClient<Database>();
const isSubmitting = ref(false);

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
});

async function savePreferences() {
  if (!user.value) return;

  isSubmitting.value = true;
  try {
    const { error } = await supabase.from("user_preferences").upsert({
      user_id: user.value.id,
      subjects: submitForm.subjects,
      notification_frequency: submitForm.frequencies,
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
