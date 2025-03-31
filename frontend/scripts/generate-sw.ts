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

// This would go in your firebase-messaging-sw.js file
self.addEventListener("notificationclick", function (event) {
  console.log('Notification click received:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const notifData = event.notification.data;
  let questionId;
  
  // FCM puts the data in different places depending on the platform
  if (notifData && notifData.FCM_MSG && notifData.FCM_MSG.data) {
    // This is how FCM structures the data in the service worker
    questionId = notifData.FCM_MSG.data.question_id;
  } else if (event.notification.data) {
    // Direct access might work in some browsers
    questionId = event.notification.data.question_id;
  }
  
  // Default fallback URL (questions list page)
  let url = '/questions';
  
  // If we have a question ID, navigate to that specific question
  if (questionId) {
    url = '/questions/' + questionId;
  }
  
  // Add base URL if needed for your project
  if (!url.startsWith('http')) {
    // Use your app's base URL
    url = self.registration.scope + url.replace(/^\//, '');
  }
  
  console.log('Navigating to URL:', url);
  
  // Handle the click event - open or focus the appropriate window
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(clientList => {
      // Check if there is already a window/tab open with the target URL
      for (const client of clientList) {
        // Try to match existing client URL to our target
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window/tab is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});





//comented out as it will cause duplicate notifications
// messaging.onBackgroundMessage(function(payload) {
  // console.log("Message received 3. ", payload);
  // const notificationTitle = payload.notification.title;
  // const notificationOptions = {
  //   body: payload.notification.body,
  //   icon: "/Tutor/favicon-32x32.png",
  //   badge: "/Tutor/favicon-32x32.png",
  //   data: payload.data,
  //   tag: 'tutor-notification',
  //   renotify: false,
  //   requireInteraction: true,
  //   vibrate: [200, 100, 200],
  //   actions: [
  //     {
  //       action: "open",
  //       title: "Open App",
  //     },
  //   ],
  // };

  // return self.registration.showNotification(notificationTitle, notificationOptions);
// });


`;

// Write to public directory
fs.writeFileSync(
  path.join(process.cwd(), "public", "firebase-messaging-sw.js"),
  template
);

console.log("Service worker generated successfully!");
