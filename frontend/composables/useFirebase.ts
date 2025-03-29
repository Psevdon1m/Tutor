import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

export const useFirebase = () => {
  const config = useRuntimeConfig();
  const firebaseConfig = {
    apiKey: config.public.FIREBASE_API_KEY,
    authDomain: config.public.FIREBASE_AUTH_DOMAIN,
    projectId: config.public.FIREBASE_PROJECT_ID,
    messagingSenderId: config.public.FIREBASE_MESSAGING_SENDER_ID,
    appId: config.public.FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        // Register service worker first
        const registration = await navigator.serviceWorker.register(
          "/Tutor/firebase-messaging-sw.js"
        );

        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: config.public.vapidKey,
          serviceWorkerRegistration: registration,
        });

        return token;
      }
      throw new Error("Notification permission denied");
    } catch (error) {
      console.error("Error getting permission:", error);
      throw error;
    }
  };

  const onMessageReceived = (callback: (payload: any) => void) => {
    return onMessage(messaging, callback);
  };

  return {
    requestPermission,
    onMessageReceived,
  };
};
