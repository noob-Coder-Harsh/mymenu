import { PRODUCT_NAME } from "@/lib/constants";

export const SITE_NAME = PRODUCT_NAME;

export const SEO = {
  title: `${PRODUCT_NAME} — Free QR Menu & Billing for QSR, Cafes & Food Carts`,
  description:
    "Free QR menu, ordering, and billing software for QSR, cafes, tea carts, momos carts, and cloud kitchens. Customers scan, order on phone — no app download. भारत के छोटे food businesses के लिए मुफ़्त।",
  keywords: [
    "free QR menu",
    "free billing software",
    "QSR software",
    "quick service restaurant menu",
    "digital menu for cafe",
    "QR code menu India",
    "tea cart menu app",
    "momos cart ordering",
    "cloud kitchen QR menu",
    "free restaurant ordering system",
    "food cart billing software",
    "digital menu board",
    "मुफ़्त QR मेनू",
    "रेस्टोरेंट बिलिंग सॉफ्टवेयर",
  ],
} as const;

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

export function buildSoftwareJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: PRODUCT_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Restaurant Management Software",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "INR",
    },
    description: SEO.description,
    url: siteUrl,
    image: `${siteUrl}/images/foddbaba-logo.webp`,
    featureList: [
      "Free QR digital menu",
      "Customer ordering from phone",
      "Order billing for QSR and food carts",
      "Daily sales reports",
      "No customer app download",
    ],
    audience: {
      "@type": "BusinessAudience",
      audienceType:
        "QSR, cafes, tea carts, coffee carts, momos carts, cloud kitchens",
    },
  };
}

export function buildOrganizationJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: PRODUCT_NAME,
    url: siteUrl,
    logo: `${siteUrl}/images/foddbaba-logo.webp`,
    description: SEO.description,
  };
}

export function buildWebSiteJsonLd(siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: PRODUCT_NAME,
    url: siteUrl,
    description: SEO.description,
    inLanguage: ["en", "hi"],
  };
}
