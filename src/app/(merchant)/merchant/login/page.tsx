import type { Viewport } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { BrandMark } from "@/components/brand/brand-mark";
import { PRODUCT_NAME } from "@/lib/constants";
import { LoginShell } from "./login-shell";
import { PhoneLoginForm } from "./phone-login-form";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function MerchantLoginPage() {
  return (
    <LoginShell
      hero={
        <div className="relative h-56 w-full">
          <div
            aria-hidden
            className="absolute -right-16 -top-24 h-[22rem] w-[22rem] rounded-full bg-[#f3c4a0]/25 blur-2xl"
          />
          <div
            className="absolute -right-20 -top-24 h-[20.5rem] w-[20.5rem] overflow-hidden rounded-full"
            style={{
              maskImage:
                "radial-gradient(circle at 54% 48%, #000 0%, #000 38%, transparent 72%)",
              WebkitMaskImage:
                "radial-gradient(circle at 54% 48%, #000 0%, #000 38%, transparent 72%)",
            }}
          >
            <Image
              src="/images/foddbaba-logo.webp"
              alt=""
              fill
              sizes="328px"
              className="object-cover object-[46%_48%] scale-110"
              priority
            />
          </div>
        </div>
      }
      illustration={
        <>
          <Image
            src="/images/merchant-login-bottom.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background to-transparent"
          />
        </>
      }
    >
      <h1 className="max-w-[12.5rem] text-[2.15rem] font-semibold leading-[1.05] tracking-[-0.045em]">
        Merchant
        <span className="mt-1 block text-accent">Login</span>
      </h1>

      <Suspense fallback={<p className="mt-4 text-sm text-muted">Loading…</p>}>
        <PhoneLoginForm />
      </Suspense>

      <div className="mt-auto pt-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <BrandMark size={28} />
          <p className="text-lg font-bold tracking-[-0.04em] text-accent">
            {PRODUCT_NAME}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted">For food businesses</p>
        <p className="mt-3 text-[11px] text-muted">
          By continuing, you agree to {PRODUCT_NAME}’s
          <span className="mt-0.5 block font-medium">
            Terms of Service · Privacy Policy
          </span>
        </p>
      </div>
    </LoginShell>
  );
}
