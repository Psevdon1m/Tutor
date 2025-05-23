import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type MessagePayload,
} from "firebase/messaging";
import { useNotification } from "./useNotification";

export const useFirebase = () => {
  const { showNotification } = useNotification();
  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY as string,
    authDomain: config.public.FIREBASE_AUTH_DOMAIN as string,
    projectId: config.public.FIREBASE_PROJECT_ID as string,
    storageBucket: config.public.FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: config.public.FIREBASE_MESSAGING_SENDER_ID as string,
    appId: config.public.FIREBASE_APP_ID as string,
    measurementId: config.public.FIREBASE_MEASUREMENT_ID as string,
  };
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  console.log({ messaging });

  const vapidKey = useRuntimeConfig().public.vapidKey as string;

  const requestPermission = async () => {
    try {
      console.log("1");

      const permission = await Notification.requestPermission();
      console.log("2");

      if (permission === "granted") {
        console.log("2.1");

        const registration = await navigator.serviceWorker.register(
          "/Tutor/firebase-messaging-sw.js"
        );
        console.log("2.2");
        const savedToken = localStorage.getItem("fcm_token");
        if (savedToken) {
          return savedToken;
        }
        const token = await getToken(messaging, {
          vapidKey: vapidKey,
          serviceWorkerRegistration: registration,
        });
        console.log("2.3");
        localStorage.setItem("fcm_token", token);
        showNotification("Success", "Notification permission granted");
        return token;
      }
      console.log("3");
      localStorage.removeItem("fcm_token");
      showNotification("Error", "Notification permission denied");
      throw new Error("Notification permission denied");
    } catch (error) {
      console.log("4");
      console.error("Error getting permission:", error);
      localStorage.removeItem("fcm_token");
      showNotification("Error", "Error getting permission");
      throw error;
    }
  };

  const onMessageReceived = (callback: (payload: MessagePayload) => void) => {
    return onMessage(messaging, (payload) => {
      // Only handle the message if we're in the foreground
      if (document.visibilityState === "visible") {
        callback(payload);
      }
      // service worker handle background notifications
    });
  };

  return {
    requestPermission,
    onMessageReceived,
  };
};
