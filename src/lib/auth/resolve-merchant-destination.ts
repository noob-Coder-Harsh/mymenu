export async function resolveMerchantDestination(
  signedInPath = "/merchant",
): Promise<string> {
  try {
    const response = await fetch("/api/auth/session", {
      credentials: "include",
    });
    if (response.ok) {
      const data = (await response.json()) as { needsOnboarding?: boolean };
      return data.needsOnboarding
        ? "/merchant/onboarding"
        : safeMerchantPath(signedInPath);
    }
  } catch {
    // Fall through to Firebase persistence.
  }

  try {
    const { getFirebaseAuth } = await import("@/lib/firebase/client");
    const auth = getFirebaseAuth();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      return "/merchant/login";
    }

    const idToken = await user.getIdToken();
    const response = await fetch("/api/auth/session", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    if (response.ok) {
      const data = (await response.json()) as { needsOnboarding?: boolean };
      return data.needsOnboarding
        ? "/merchant/onboarding"
        : safeMerchantPath(signedInPath);
    }
  } catch {
    // Stay on login.
  }

  return "/merchant/login";
}

function safeMerchantPath(path: string) {
  if (path.startsWith("/merchant") && !path.startsWith("//")) {
    return path;
  }
  return "/merchant";
}
