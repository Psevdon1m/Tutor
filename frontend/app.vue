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
    <div
      v-if="!isPwaInstalled"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">Install Our App</h2>
        <p class="mb-4">
          For the best experience, install our app on your device.
        </p>
        <button
          @click="installPwa"
          class="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Install
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFirebase } from "@/composables/useFirebase";
import { useNotification } from "@/composables/useNotification";
const { notification, showNotification, closeNotification } = useNotification();
const { onMessageReceived } = useFirebase();
const isPwaInstalled = ref(true);

const { $pwa } = useNuxtApp();

const installPwa = () => {
  if ($pwa?.install) {
    $pwa.install();
  }
};

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
  console.log($pwa);
  isPwaInstalled.value = $pwa?.isPWAInstalled || false;
});
</script>
