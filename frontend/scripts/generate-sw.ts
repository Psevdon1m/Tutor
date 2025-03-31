import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const template = `
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.FIREBASE_APP_ID}"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/Tutor/favicon-32x32.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

`;

// Write to public directory
fs.writeFileSync(
  path.join(process.cwd(), "public", "firebase-messaging-sw.js"),
  template
);

console.log("Service worker generated successfully!");
