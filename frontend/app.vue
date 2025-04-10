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

    <!-- Use InstallPrompt component for PWA installation -->
    <InstallPrompt
      :show="!isPwaInstalled"
      title="Install Our App"
      message="For the best experience, install our app on your device."
      buttonText="Install"
      @action="installPwa"
    />

    <!-- Use InstallPrompt component for iOS installation instructions -->
    <InstallPrompt
      :show="showIosInstallPrompt"
      title="Install Our App"
      message="To install this app on your iPhone, tap the 'Share' icon and then 'Add to Home Screen'."
      buttonText="Got it!"
      @action="closeIosInstallPrompt"
    />
  </div>
</template>

<script setup lang="ts">
import { useFirebase } from "@/composables/useFirebase";
import { useNotification } from "@/composables/useNotification";
import InstallPrompt from "@/components/InstallPrompt.vue";

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
  return navigator.vendor.includes("Apple");
}
</script>
