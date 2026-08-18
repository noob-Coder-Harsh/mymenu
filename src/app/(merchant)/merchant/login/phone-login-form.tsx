"use client";

import { RecaptchaVerifier, onAuthStateChanged, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { toE164India } from "@/lib/phone";

function safeNextPath(path: string | null) {
  if (path?.startsWith("/merchant") && !path.startsWith("//")) {
    return path;
  }
  return "/merchant";
}

async function createServerSession(
  idToken: string,
  router: ReturnType<typeof useRouter>,
  nextPath: string,
) {
  const response = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = (await response.json()) as {
    error?: string;
    needsOnboarding?: boolean;
  };
  if (!response.ok) {
    throw new Error(data.error || "Could not start session");
  }
  router.replace(data.needsOnboarding ? "/merchant/onboarding" : nextPath);
  router.refresh();
}

function firebaseErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code: string }).code)
      : "";

  switch (code) {
    case "auth/invalid-phone-number":
      return "Enter a valid 10-digit Indian mobile number.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a minute and try again.";
    case "auth/invalid-verification-code":
      return "That code is incorrect.";
    case "auth/code-expired":
      return "Code expired. Request a new one.";
    case "auth/billing-not-enabled":
      return "Firebase requires Blaze billing before it can send SMS OTPs.";
    case "auth/operation-not-allowed":
      return "Firebase is blocking SMS for this project. Open Authentication → Settings → SMS region policy and allow India (IN). Also enable Sign-in method → Phone. Then try a test number from that same Phone screen.";
    default: {
      if (error instanceof Error && error.message) {
        return error.message;
      }
      return "Could not verify phone. Try again.";
    }
  }
}

export function PhoneLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const recaptchaVerifierHolder = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch("/api/auth/session", { credentials: "include" });
        if (cancelled) {
          return;
        }
        if (response.ok) {
          const data = (await response.json()) as { needsOnboarding?: boolean };
          router.replace(data.needsOnboarding ? "/merchant/onboarding" : nextPath);
          return;
        }
      } catch {
        // Fall through to Firebase persistence.
      }

      try {
        const auth = getFirebaseAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          unsubscribe();
          if (cancelled || !user) {
            return;
          }
          try {
            const idToken = await user.getIdToken();
            await createServerSession(idToken, router, nextPath);
          } catch {
            // Stay on login.
          }
        });
      } catch {
        // Firebase client env missing; keep the login form.
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
      recaptchaVerifierHolder.current?.clear();
      recaptchaVerifierHolder.current = null;
    };
  }, [nextPath, router]);

  async function ensureVerifier() {
    if (recaptchaVerifierHolder.current) {
      return recaptchaVerifierHolder.current;
    }
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    recaptchaVerifierHolder.current = verifier;
    return verifier;
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const e164 = toE164India(phone);
    if (!e164) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setLoading(true);
    try {
      const verifier = await ensureVerifier();
      confirmationRef.current = await signInWithPhoneNumber(
        getFirebaseAuth(),
        e164,
        verifier,
      );
      setStep("otp");
    } catch (reason) {
      recaptchaVerifierHolder.current?.clear();
      recaptchaVerifierHolder.current = null;
      setError(firebaseErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!confirmationRef.current) {
      setError("Request a new code.");
      setStep("phone");
      return;
    }
    if (otp.trim().length < 6) {
      setError("Enter the 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmationRef.current.confirm(otp.trim());
      const idToken = await credential.user.getIdToken();
      await createServerSession(idToken, router, nextPath);
    } catch (reason) {
      setError(firebaseErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {step === "phone" ? (
        <form className="flex flex-col gap-4" onSubmit={sendCode}>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Mobile number
            <div className="flex overflow-hidden rounded-2xl border border-border bg-surface">
              <span className="flex items-center bg-background px-3 text-muted">
                +91
              </span>
              <input
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
                }
                className="h-12 w-full bg-transparent px-3 text-base outline-none"
                placeholder="98765 43210"
              />
            </div>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? "Sending…" : "Send OTP"}
          </button>
        </form>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={verifyCode}>
          <p className="text-sm text-muted">
            Code sent to +91 {phone}.{" "}
            <button
              type="button"
              className="font-medium text-accent"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError(null);
              }}
            >
              Change number
            </button>
          </p>
          <label className="flex flex-col gap-2 text-sm font-medium">
            6-digit code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="h-12 rounded-2xl border border-border bg-surface px-4 text-base tracking-[0.4em] outline-none focus:border-accent"
              placeholder="••••••"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 items-center justify-center rounded-2xl bg-accent px-5 text-base font-medium text-accent-foreground disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify and continue"}
          </button>
        </form>
      )}

      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <p className="text-xs leading-5 text-muted">
          New Firebase projects block every SMS country by default. Allow India
          under Authentication → Settings → SMS region policy, or add a test
          phone number under Sign-in method → Phone.
        </p>
      )}
      <div id="recaptcha-container" />
    </div>
  );
}
