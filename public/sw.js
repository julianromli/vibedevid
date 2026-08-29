// Uninstall shim. The previous worker cached HTML and hashed JS and broke
// in-app browsers (Threads, Instagram) after deploys. This file replaces that
// worker so already-installed clients drop it on the next load.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim()),
  );
});
