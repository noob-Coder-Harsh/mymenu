import Link from "next/link";
import { DEMO_STORE_SLUG, PRODUCT_NAME } from "@/lib/constants";
import { BrandMark } from "@/components/brand/brand-mark";
import { Bilingual } from "@/components/home/bilingual";
import { MerchantStartLink } from "@/components/home/merchant-start-link";
import { PhoneMenuPreview } from "@/components/home/phone-menu-preview";

const DEMO_HREF = `/s/${DEMO_STORE_SLUG}`;

export function HomeLanding() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between px-5 pt-5">
        <div className="flex items-center gap-2.5">
          <BrandMark size={36} priority />
          <span className="text-base font-semibold tracking-tight">
            {PRODUCT_NAME}
          </span>
        </div>
        <MerchantStartLink
          showBusy
          compactBusy
          className="flex flex-col items-end rounded-xl px-2 py-1 text-right text-sm font-medium text-accent"
        >
          Login
          <span lang="hi" className="block text-[11px] font-medium text-muted">
            लॉगिन
          </span>
        </MerchantStartLink>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-10 px-5 pb-28 pt-8">
        <section className="flex flex-col items-center text-center">
          <Bilingual
            as="h1"
            en="Your menu on the phone"
            hi="आपका मेनू फ़ोन पर"
            className="text-[2rem] font-semibold leading-[1.15] tracking-tight"
            hiClassName="mt-2 block text-[1.35rem] font-semibold text-foreground"
          />
          <Bilingual
            en="Free QR menu, ordering & billing for QSR and food carts."
            hi="QSR, चाय-कॉफ़ी कार्ट के लिए मुफ़्त QR मेनू और बिलिंग।"
            className="mt-4 max-w-[22rem] text-base leading-7"
            hiClassName="mt-1 block text-[0.95rem] leading-6 text-muted"
          />

          <MerchantStartLink
            showBusy
            className="mt-6 flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-accent px-5 py-3 text-accent-foreground"
          >
            <span className="text-lg font-semibold">Make your menu</span>
            <span lang="hi" className="text-sm font-medium opacity-90">
              अपना मेनू बनाएं
            </span>
          </MerchantStartLink>
          <a
            href="#how-it-works"
            className="mt-3 py-2 text-sm font-medium text-accent"
          >
            See how it works
            <span lang="hi" className="mt-0.5 block text-xs text-muted">
              कैसे काम करता है
            </span>
          </a>

          <div className="mt-8 w-full">
            <PhoneMenuPreview />
          </div>
        </section>

        <section
          id="how-it-works"
          className="scroll-mt-6 rounded-3xl border border-border bg-surface px-5 py-6"
        >
          <Bilingual
            as="h2"
            en="What will the customer do?"
            hi="ग्राहक क्या करेगा?"
            className="text-xl font-semibold leading-snug"
            hiClassName="mt-1 block text-lg font-semibold text-foreground"
          />
          <ol className="mt-5 flex flex-col">
            {CUSTOMER_STEPS.map((step, index) => (
              <li key={step.en} className="flex flex-col">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-xl">
                    {step.icon === "qr" ? <QrMark /> : step.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-accent">
                      {index + 1}
                    </p>
                    <Bilingual
                      en={step.en}
                      hi={step.hi}
                      className="text-base font-semibold leading-tight"
                      hiClassName="mt-0.5 block text-sm font-medium text-muted"
                    />
                  </div>
                </div>
                {index < CUSTOMER_STEPS.length - 1 ? (
                  <div
                    className="ml-[21px] h-6 w-px bg-border"
                    aria-hidden
                  />
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <Bilingual
            as="h2"
            en="What becomes easy for you?"
            hi="आपके लिए क्या आसान होगा?"
            className="text-xl font-semibold leading-snug"
            hiClassName="mt-1 block text-lg font-semibold text-foreground"
          />
          <ul className="mt-4 grid gap-3">
            {BENEFITS.map((item) => (
              <li
                key={item.en}
                className="flex gap-3 rounded-3xl border border-border bg-surface px-4 py-4"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/12 text-2xl">
                  {item.icon}
                </span>
                <Bilingual
                  en={item.en}
                  hi={item.hi}
                  className="pt-0.5 text-[15px] font-semibold leading-snug"
                  hiClassName="mt-1 block text-sm font-medium leading-5 text-muted"
                />
              </li>
            ))}
          </ul>
        </section>

        <section>
          <Bilingual
            as="h2"
            en="Built for small food businesses"
            hi="छोटे food businesses के लिए"
            className="text-xl font-semibold leading-snug"
            hiClassName="mt-1 block text-lg font-semibold text-foreground"
          />
          <Bilingual
            en="Free digital menu and billing software for QSR counters, cafes, tea carts, coffee carts, momos carts, and cloud kitchens."
            hi="QSR, कैफ़े, चाय-कॉफ़ी कार्ट, मोमोज कार्ट और cloud kitchen के लिए मुफ़्त डिजिटल मेनू व बिलिंग।"
            className="mt-3 text-base leading-7"
            hiClassName="mt-1 block text-sm leading-6 text-muted"
          />
          <ul className="mt-5 flex flex-col gap-2">
            {AUDIENCES.map((item) => (
              <li
                key={item.en}
                className="border-b border-border pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-[15px] font-semibold leading-snug">
                  {item.en}
                </p>
                <p lang="hi" className="mt-0.5 text-sm text-muted">
                  {item.hi}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-[#2c1810] px-5 py-6 text-[#fffdf9]">
          <Bilingual
            as="h2"
            en="Only 3 steps"
            hi="सिर्फ 3 काम"
            className="text-xl font-semibold"
            hiClassName="mt-1 block text-lg font-semibold text-[#fffdf9]"
            enClassName=""
          />
          <ol className="mt-5 flex flex-col gap-4">
            {MERCHANT_STEPS.map((step, index) => (
              <li key={step.en} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent text-lg font-bold text-accent-foreground">
                  {index + 1}
                </span>
                <Bilingual
                  en={step.en}
                  hi={step.hi}
                  className="pt-1 text-base font-semibold leading-snug"
                  hiClassName="mt-0.5 block text-sm font-medium text-[#eadfd6]"
                />
              </li>
            ))}
          </ol>
        </section>

        <section className="flex flex-col items-center text-center">
          <Bilingual
            as="h2"
            en="Your menu will look like this"
            hi="आपका मेनू ऐसा दिखेगा"
            className="text-xl font-semibold leading-snug"
            hiClassName="mt-1 block text-lg font-semibold text-foreground"
          />
          <div className="mt-6 w-full">
            <PhoneMenuPreview size="lg" />
          </div>
          <Link
            href={DEMO_HREF}
            className="mt-6 flex min-h-12 w-full flex-col items-center justify-center rounded-2xl border border-border bg-surface px-5 py-3"
          >
            <span className="text-base font-semibold">See a real menu</span>
            <span lang="hi" className="text-sm text-muted">
              असली मेनू देखें
            </span>
          </Link>
        </section>

        <section className="rounded-3xl border border-border bg-surface px-5 py-6">
          <Bilingual
            as="h2"
            en="Want to take orders too?"
            hi="ऑर्डर भी लेना है?"
            className="text-xl font-semibold leading-snug"
            hiClassName="mt-1 block text-lg font-semibold text-foreground"
          />
          <Bilingual
            en="Customer can order from their phone."
            hi="ग्राहक मोबाइल से सीधे ऑर्डर कर सकता है।"
            className="mt-3 text-base leading-7"
            hiClassName="mt-1 block text-sm leading-6 text-muted"
          />
          <div className="mt-4 rounded-2xl bg-background px-4 py-3 text-left">
            <p className="text-xs font-medium text-muted">New order</p>
            <p className="mt-1 text-base font-semibold">2 Veg Momos · ₹140</p>
            <p lang="hi" className="text-sm text-muted">
              नया ऑर्डर · 2 वेज मोमोज
            </p>
          </div>
          <MerchantStartLink
            signedInHref="/merchant/orders"
            className="mt-5 flex min-h-12 w-full flex-col items-center justify-center rounded-2xl border border-border px-5 py-3"
          >
            <span className="text-base font-semibold">See orders</span>
            <span lang="hi" className="text-sm text-muted">
              ऑर्डर देखें
            </span>
          </MerchantStartLink>
        </section>

        <section className="rounded-3xl border border-accent/30 bg-accent/10 px-5 py-7 text-center">
          <Bilingual
            as="h2"
            en="Price"
            hi="कीमत"
            className="text-lg font-semibold"
            hiClassName="mt-1 block text-base font-semibold text-foreground"
          />
          <p className="mt-3 text-5xl font-semibold tracking-tight">FREE</p>
          <p className="mt-1 text-2xl font-semibold">₹0</p>
          <p className="mt-1 text-sm text-muted">
            per month
            <span lang="hi" className="mt-0.5 block">
              महीने ₹0
            </span>
          </p>
          <MerchantStartLink
            showBusy
            className="mt-6 flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-accent px-5 py-3 text-accent-foreground"
          >
            <span className="text-lg font-semibold">Start now</span>
            <span lang="hi" className="text-sm font-medium opacity-90">
              शुरू करें
            </span>
          </MerchantStartLink>
        </section>

        <section className="pb-4 text-center">
          <Bilingual
            as="h2"
            en="Make your menu today"
            hi="आज ही अपना मेनू बनाएं"
            className="text-[1.65rem] font-semibold leading-snug tracking-tight"
            hiClassName="mt-2 block text-xl font-semibold text-foreground"
          />
          <Bilingual
            en="Customer only has to scan the QR."
            hi="ग्राहक को बस QR स्कैन करना है।"
            className="mt-3 text-base leading-7"
            hiClassName="mt-1 block text-sm leading-6 text-muted"
          />
          <MerchantStartLink
            showBusy
            className="mt-6 flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-accent px-5 py-3 text-accent-foreground"
          >
            <span className="text-lg font-semibold">Make your menu</span>
            <span lang="hi" className="text-sm font-medium opacity-90">
              अपना मेनू बनाएं
            </span>
          </MerchantStartLink>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-sm">
        <div className="mx-auto max-w-md">
          <MerchantStartLink
            showBusy
            compactBusy
            className="flex min-h-14 w-full flex-col items-center justify-center rounded-2xl bg-accent px-5 py-2.5 text-accent-foreground shadow-[0_10px_30px_-12px_rgba(196,92,38,0.8)]"
          >
            <span className="text-base font-semibold">Make your menu</span>
            <span lang="hi" className="text-xs font-medium opacity-90">
              अपना मेनू बनाएं
            </span>
          </MerchantStartLink>
        </div>
      </div>
    </div>
  );
}

const CUSTOMER_STEPS = [
  { icon: "qr", en: "See the QR code", hi: "QR कोड देखेगा" },
  { icon: "📱", en: "Scan with the phone", hi: "मोबाइल से स्कैन करेगा" },
  { icon: "📋", en: "See the menu", hi: "मेनू देखेगा" },
  { icon: "✅", en: "Place the order", hi: "ऑर्डर करेगा" },
] as const;

function QrMark() {
  const cells = [
    1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1,
    0, 0, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1,
  ];
  return (
    <span className="grid grid-cols-7 gap-px" aria-hidden>
      {cells.map((on, index) => (
        <span
          key={index}
          className={`h-[5px] w-[5px] ${on ? "bg-foreground" : "bg-transparent"}`}
        />
      ))}
    </span>
  );
}

const BENEFITS = [
  {
    icon: "📱",
    en: "Menu on the phone. Change it anytime.",
    hi: "मेनू मोबाइल पर। कभी भी बदलें।",
  },
  {
    icon: "🖨️",
    en: "Put the QR on the table or cart.",
    hi: "QR कोड टेबल या दुकान पर लगाएं।",
  },
  {
    icon: "✏️",
    en: "Change items and prices yourself.",
    hi: "सामान और कीमत खुद बदलें।",
  },
  {
    icon: "🧾",
    en: "Take orders and keep simple billing.",
    hi: "ऑर्डर लें और आसान बिलिंग रखें।",
  },
  {
    icon: "🏪",
    en: "Your name and photo. Your menu.",
    hi: "अपना नाम और फोटो। अपना ही मेनू।",
  },
] as const;

const AUDIENCES = [
  {
    en: "QSR & quick counters — free ordering + billing",
    hi: "QSR और quick counter — मुफ़्त ऑर्डरिंग व बिलिंग",
  },
  {
    en: "Tea, coffee & juice carts — QR menu on the stall",
    hi: "चाय, कॉफ़ी, जूस कार्ट — दुकान पर QR मेनू",
  },
  {
    en: "Momos, fries & snack carts — phone orders",
    hi: "मोमोज, फ्राइज़, स्नैक कार्ट — फ़ोन से ऑर्डर",
  },
  {
    en: "Cafes & cloud kitchens — digital menu, no app needed",
    hi: "कैफ़े और cloud kitchen — ऐप के बिना डिजिटल मेनू",
  },
] as const;

const MERCHANT_STEPS = [
  { en: "Make your shop", hi: "दुकान बनाएं" },
  { en: "Add your items", hi: "सामान डालें" },
  { en: "Put up the QR code", hi: "QR Code लगाएं" },
] as const;
