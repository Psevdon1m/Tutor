import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const template = `

self.addEventListener('push', (event) => {
  const payload = event.data?.json();
  if (!payload) return;

  event.waitUntil(
    self.registration.showNotification(payload.notification.title, {
      body: payload.notification.body,
      icon: "/Tutor/favicon-32x32.png",
      badge: "/Tutor/favicon-32x32.png",
      data: payload.data
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/Tutor/')
  );
});
`;

// Write to public directory
fs.writeFileSync(
  path.join(process.cwd(), "public", "firebase-messaging-sw.js"),
  template
);

console.log("Service worker generated successfully!");
