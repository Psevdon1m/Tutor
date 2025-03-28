<template>
  <div class="flex items-center justify-between mb-12">
    <div class="flex items-center gap-4">
      <img
        :src="userData?.avatar_url || 'https://placehold.co/400x400'"
        :alt="userData?.full_name || 'User'"
        class="w-12 h-12 rounded-full object-cover"
      />
      <div>
        <p class="text-lg font-medium text-gray-900">
          {{ userData?.full_name }}
        </p>
        <p class="text-sm text-gray-500">{{ userData?.email }}</p>
      </div>
    </div>
    <button
      @click="handleSignOut"
      class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
      title="Sign Out"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { UserProfile } from "~/types/user";

const user = useSupabaseUser();
const supabase = useSupabaseClient();
const userData = ref<UserProfile | null>(
  user.value?.user_metadata as UserProfile
);

const handleSignOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // Nuxt will automatically handle the navigation when user is signed out
  } catch (error) {
    console.error("Error signing out:", error);
  }
};
</script>
