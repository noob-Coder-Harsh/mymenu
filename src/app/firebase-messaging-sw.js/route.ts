export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * FCM service worker with public Firebase web config injected from env.
 * Registered from merchant/customer clients as /firebase-messaging-sw.js
 */
export function GET() {
  const config = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  };

  const body = `/* foodbaba fcm sw */
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");
firebase.initializeApp(${JSON.stringify(config)});
try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function (payload) {
    var title = (payload.notification && payload.notification.title) || "FoodBaba";
    var options = {
      body: (payload.notification && payload.notification.body) || "",
      data: payload.data || {},
    };
    return self.registration.showNotification(title, options);
  });
  self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    var url = (event.notification.data && event.notification.data.url) || "/";
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if ("focus" in client) {
            if (url) client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  });
} catch (e) {
  console.warn("[fcm-sw]", e);
}
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "Service-Worker-Allowed": "/",
    },
  });
}
