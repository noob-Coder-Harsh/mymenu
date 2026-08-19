"use client";

import {
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ idToken }),
  });

  const data = (await response.json()) as {
    error?: string;
    needsOnboarding?: boolean;
  };

  if (!response.ok) {
    throw new Error(data.error || "Could not start session");
  }

  router.replace(
    data.needsOnboarding ? "/merchant/onboarding" : nextPath,
  );

  router.refresh();
}

function firebaseErrorMessage(error: unknown) {
  const code =
    typeof error === "object" &&
      error &&
      "code" in error
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
      return "Phone login is currently unavailable. Please check your Firebase phone authentication settings.";

    default: {
      if (error instanceof Error && error.message) {
        return error.message;
      }

      return "Could not verify phone. Try again.";
    }
  }
}

function ArrowIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12h13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="m13 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m5 12.5 4.2 4.2L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const nextPath = safeNextPath(searchParams.get("next"));

  const recaptchaVerifierHolder =
    useRef<RecaptchaVerifier | null>(null);

  const confirmationRef =
    useRef<ConfirmationResult | null>(null);

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [step, setStep] =
    useState<"phone" | "otp">("phone");

  const [loading, setLoading] = useState(false);
  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const response = await fetch(
          "/api/auth/session",
          {
            credentials: "include",
          },
        );

        if (cancelled) {
          return;
        }

        if (response.ok) {
          const data =
            (await response.json()) as {
              needsOnboarding?: boolean;
            };

          router.replace(
            data.needsOnboarding
              ? "/merchant/onboarding"
              : nextPath,
          );

          return;
        }
      } catch {
        // Fall through to Firebase persistence.
      }

      try {
        const auth = getFirebaseAuth();

        const unsubscribe =
          onAuthStateChanged(
            auth,
            async (user) => {
              unsubscribe();

              if (cancelled || !user) {
                return;
              }

              try {
                const idToken =
                  await user.getIdToken();

                await createServerSession(
                  idToken,
                  router,
                  nextPath,
                );
              } catch {
                // Stay on login.
              }
            },
          );
      } catch {
        // Firebase client env missing.
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

    const verifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      {
        size: "invisible",
      },
    );

    recaptchaVerifierHolder.current = verifier;

    return verifier;
  }

  async function sendCode(event: FormEvent) {
    event.preventDefault();

    setError(null);

    const e164 = toE164India(phone);

    if (!e164) {
      setError(
        "Enter a valid 10-digit Indian mobile number.",
      );
      return;
    }

    setLoading(true);

    try {
      const verifier = await ensureVerifier();

      confirmationRef.current =
        await signInWithPhoneNumber(
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
      const credential =
        await confirmationRef.current.confirm(
          otp.trim(),
        );

      const idToken =
        await credential.user.getIdToken();

      await createServerSession(
        idToken,
        router,
        nextPath,
      );
    } catch (reason) {
      setError(firebaseErrorMessage(reason));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      <p className="mt-8 max-w-[16rem] text-sm leading-6 text-muted">
          {step === "phone"
            ? "Enter your mobile number for a one-time code."
            : "Enter the 6-digit code sent to your phone."}
      </p>

      <div className="mt-5 rounded-2xl border border-[#eadfd7] bg-white p-3.5 shadow-[0_12px_40px_rgba(77,48,34,0.07)]">
          {step === "phone" ? (
            <form
              className="flex flex-col gap-3"
              onSubmit={sendCode}
            >
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-[#33231d]">
                  Mobile number
                </span>

                <div
                  className={[
                    "flex h-12 overflow-hidden rounded-2xl",
                    "border border-[#e5d8d0] bg-[#fcfaf8]",
                    "transition-all",
                    "focus-within:border-[#cf5b27]",
                    "focus-within:ring-4 focus-within:ring-[#cf5b27]/10",
                  ].join(" ")}
                >
                  <div className="flex items-center border-r border-[#e9ded7] px-3 text-[16px] font-semibold text-[#5e4c44]">
                    +91
                  </div>

                  <input
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(event) =>
                      setPhone(
                        event.target.value
                          .replace(/\D/g, "")
                          .slice(0, 10),
                      )
                    }
                    onFocus={(event) =>
                      event.currentTarget.scrollIntoView({
                        block: "center",
                        behavior: "smooth",
                      })
                    }
                    className="h-full w-full bg-transparent px-3 text-[16px] font-medium tracking-wide text-[#2d1b15] outline-none placeholder:text-[#b4a49d]"
                    placeholder="98765 43210"
                    aria-label="Mobile number"
                  />
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  loading ||
                  phone.length !== 10
                }
                className={[
                  "group flex h-12 items-center justify-center gap-2",
                  "rounded-2xl px-4 text-[16px] font-semibold",
                  "bg-[#c95422] text-white",
                  "shadow-[0_10px_25px_rgba(201,84,34,0.22)]",
                  "transition-all duration-200",
                  "hover:bg-[#b94a1c] hover:shadow-[0_12px_30px_rgba(201,84,34,0.28)]",
                  "active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                ].join(" ")}
              >
                <span>
                  {loading
                    ? "Sending code…"
                    : "Send OTP"}
                </span>

                {!loading && (
                  <span className="transition-transform duration-200 group-hover:translate-x-1">
                    <ArrowIcon />
                  </span>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 pt-0.5 text-[11px] leading-4 text-[#958078]">
                <span className="text-[#4aab75]">
                  <CheckIcon />
                </span>
                OTP login · we never share your number
              </p>
            </form>
          ) : (
            <form
              className="flex flex-col gap-3"
              onSubmit={verifyCode}
            >
              <div className="flex items-center justify-between gap-2 rounded-xl bg-[#fcf7f3] px-3 py-2">
                <p className="text-sm font-semibold text-[#3b2820]">
                  +91 {phone}
                </p>
                <button
                  type="button"
                  className="text-xs font-semibold text-[#c95422]"
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError(null);
                  }}
                >
                  Change
                </button>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-[#33231d]">
                  6-digit code
                </span>

                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(event) =>
                    setOtp(
                      event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6),
                    )
                  }
                  onFocus={(event) =>
                    event.currentTarget.scrollIntoView({
                      block: "center",
                      behavior: "smooth",
                    })
                  }
                  className={[
                    "h-12 w-full rounded-2xl",
                    "border border-[#e5d8d0]",
                    "bg-[#fcfaf8] px-3",
                    "text-center text-xl font-semibold tracking-[0.45em]",
                    "text-[#2d1b15] outline-none",
                    "transition-all",
                    "focus:border-[#cf5b27]",
                    "focus:ring-4 focus:ring-[#cf5b27]/10",
                  ].join(" ")}
                  placeholder="••••••"
                  aria-label="6 digit verification code"
                />
              </label>

              <button
                type="submit"
                disabled={
                  loading ||
                  otp.length !== 6
                }
                className={[
                  "flex h-12 items-center justify-center gap-2",
                  "rounded-2xl px-4 text-[16px] font-semibold",
                  "bg-[#c95422] text-white",
                  "shadow-[0_10px_25px_rgba(201,84,34,0.22)]",
                  "transition-all",
                  "hover:bg-[#b94a1c]",
                  "active:scale-[0.99]",
                  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
                ].join(" ")}
              >
                {loading
                  ? "Verifying…"
                  : "Verify & continue"}

                {!loading && <ArrowIcon />}
              </button>
            </form>
          )}

          {error && (
            <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm leading-5 text-red-700">
              {error}
            </div>
          )}
      </div>

      <div id="recaptcha-container" />
    </div>
  );
}
