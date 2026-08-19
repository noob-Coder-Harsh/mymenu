import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";

export async function logoutMerchant() {
  try {
    await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include",
    });
  } catch {
    // Still wipe the client even if the cookie request fails.
  }

  try {
    await signOut(getFirebaseAuth());
  } catch {
    // Firebase client may be unconfigured in some local setups.
  }

  await clearMerchantBrowserState();
}

async function clearMerchantBrowserState() {
  try {
    for (const key of Object.keys(window.localStorage)) {
      if (/firebase/i.test(key)) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {
    // Private mode can block storage.
  }

  try {
    for (const key of Object.keys(window.sessionStorage)) {
      if (/firebase/i.test(key)) {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore.
  }

  try {
    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0]?.trim();
      if (!name) {
        return;
      }
      if (name === "fb_session" || /firebase/i.test(name)) {
        document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
      }
    });
  } catch {
    // HttpOnly cookies are cleared by the session API.
  }

  try {
    const databases = await indexedDB.databases();
    await Promise.all(
      databases
        .map((database) => database.name)
        .filter((name): name is string => Boolean(name && /firebase/i.test(name)))
        .map(
          (name) =>
            new Promise<void>((resolve) => {
              const request = indexedDB.deleteDatabase(name);
              request.onsuccess = () => resolve();
              request.onerror = () => resolve();
              request.onblocked = () => resolve();
            }),
        ),
    );
  } catch {
    await Promise.all(
      [
        "firebaseLocalStorageDb",
        "firebase-heartbeat-database",
        "firebase-installations-database",
      ].map(
        (name) =>
          new Promise<void>((resolve) => {
            const request = indexedDB.deleteDatabase(name);
            request.onsuccess = () => resolve();
            request.onerror = () => resolve();
            request.onblocked = () => resolve();
          }),
      ),
    );
  }
}
