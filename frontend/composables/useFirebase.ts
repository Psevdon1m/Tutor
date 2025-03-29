import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

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

export const useFirebase = () => {
  const app = initializeApp(firebaseConfig);
  const messaging = getMessaging(app);
  const vapidKey = useRuntimeConfig().public.vapidKey as string;

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: vapidKey as string,
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
