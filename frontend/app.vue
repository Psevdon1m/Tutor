<template>
  <div>
    <InAppNotification
      :title="notification.title"
      :body="notification.body"
      :show="notification.show"
      :data="notification.data"
      @close="closeNotification"
    />
    <NuxtPwaManifest />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
import { useFirebase } from "@/composables/useFirebase";
import { useNotification } from "@/composables/useNotification";
const { notification, showNotification, closeNotification } = useNotification();
const { onMessageReceived } = useFirebase();

onMounted(() => {
  onMessageReceived((payload) => {
    console.log("Message received 2. ", payload);
    console.log({ data: payload?.data });

    if (payload.notification) {
      showNotification(
        payload.notification.title + " app.vue" || "",
        payload.notification.body || "",
        payload?.data || {}
      );
    }
  });
});
</script>
