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
    <div
      v-if="showIosInstallPrompt"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-bold mb-4">Install Our App</h2>
        <p class="mb-4">
          To install this app on your iPhone, tap the "Share" icon and then "Add
          to Home Screen".
        </p>
        <button
          @click="closeIosInstallPrompt"
          class="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Got it!
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

let deferredPrompt: any;

window.addEventListener("beforeinstallprompt", (e) => {
  console.log("beforeinstallprompt");
  e.preventDefault();
  console.log({ e });

  deferredPrompt = e;
});

const installPwa = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      console.log("User accepted the A2HS prompt");
    } else {
      console.log("User dismissed the A2HS prompt");
    }
    deferredPrompt = null;
  }
};

const showIosInstallPrompt = ref(false);

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
  console.log($pwa?.isPWAInstalled);

  if (isSafari() && !$pwa?.isPWAInstalled) {
    debugger;
    showIosInstallPrompt.value = true;
  } else if (!isSafari()) {
    isPwaInstalled.value = $pwa?.isPWAInstalled || false;
  }
});

watch(
  () => $pwa?.isPWAInstalled,
  (newVal) => {
    console.log("isPwaInstalled", newVal);
    isPwaInstalled.value = newVal || false;
  }
);

const closeIosInstallPrompt = () => {
  showIosInstallPrompt.value = false;
};

function isSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(userAgent);
  const isMac = /macintosh/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);

  // Check for iOS Safari or macOS Safari
  const result = (isIos || isMac) && isSafari;
  console.log("isSafari", result);
  return result;
}
</script>
