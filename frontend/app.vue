<template>
  <div>
    <InAppNotification
      :title="notification.title"
      :body="notification.body"
      :show="notification.show"
      @close="closeNotification"
    />
    <NuxtPwaManifest />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useFirebase } from "@/composables/useFirebase";

const { onMessageReceived } = useFirebase();

const notification = reactive({
  title: "",
  body: "",
  show: false,
});

const showNotification = (title: string, body: string) => {
  notification.title = title;
  notification.body = body;
  notification.show = true;
  // Auto-hide after 5 seconds
  setTimeout(() => {
    notification.show = false;
  }, 5000);
};

const closeNotification = () => {
  notification.show = false;
};

onMounted(() => {
  onMessageReceived((payload) => {
    console.log("Message received 2. ", payload);
    if (payload.notification) {
      showNotification(
        payload.notification.title + " app.vue" || "",
        payload.notification.body || ""
      );
    }
  });
});
</script>
