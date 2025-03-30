<template>
  <button
    @click="handleNotificationSubscription"
    :disabled="isSubscribing"
    class="relative p-3 rounded-full hover:bg-gray-100 transition-colors"
    :title="
      isSubscribing
        ? 'Subscribing...'
        : isSubscribed
        ? 'Notifications enabled'
        : 'Enable notifications'
    "
  >
    <!-- Bell Icons -->
    <img
      v-if="isSubscribed"
      src="@/assets/icons/success-bell.png"
      alt="Notifications enabled"
      class="w-6 h-6"
    />
    <img
      v-else
      src="@/assets/icons/error-bell.png"
      alt="Notifications disabled"
      class="w-6 h-6"
    />

    <!-- Loading Spinner -->
    <div
      v-if="isSubscribing"
      class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-full"
    >
      <div
        class="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"
      ></div>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { User } from "@supabase/supabase-js";
import type { Database } from "~/types/database";
const props = defineProps<{
  user: User | null;
}>();
const isSubscribing = ref(false);
const isSubscribed = localStorage.getItem("fcm_token") ? ref(true) : ref(false);
const { requestPermission } = useFirebase();
const supabase = useSupabaseClient<Database>();
const userStore = useUserStore();

const handleNotificationSubscription = async () => {
  if (isSubscribed.value) {
    await unsubscribeFromNotifications();
  } else {
    await subscribeToNotifications();
  }
};

const subscribeToNotifications = async () => {
  isSubscribing.value = true;
  try {
    const token = await requestPermission();
    if (token) {
      // Save the token to your Supabase user_preferences table

      const { error } = await supabase.from("user_preferences").upsert({
        user_id: props.user?.id,
        fcm_token: token,
        updated_at: new Date().toISOString(),
        subjects: userStore.getUserPreferences.subjects,
      });

      if (error) throw error;
      console.log("Successfully subscribed to notifications");
      isSubscribed.value = true;
    }
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
  } finally {
    isSubscribing.value = false;
  }
};
const unsubscribeFromNotifications = async () => {
  isSubscribing.value = true;
  try {
    const { error } = await supabase
      .from("user_preferences")
      .update({
        fcm_token: null,
        updated_at: new Date().toISOString(),
        subjects: userStore.getUserPreferences.subjects,
      })
      .eq("user_id", props.user?.id);
    localStorage.removeItem("fcm_token");
    if (error) throw error;
    console.log("Successfully unsubscribed from notifications");
    isSubscribed.value = false;
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
  } finally {
    isSubscribing.value = false;
  }
};
</script>
