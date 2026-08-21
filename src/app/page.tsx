import type { Metadata } from "next";
import { HomeLanding } from "@/components/home/home-landing";
import { MerchantStartProvider } from "@/components/home/merchant-start-link";
import {
  SEO,
  buildOrganizationJsonLd,
  buildSoftwareJsonLd,
  buildWebSiteJsonLd,
  getSiteUrl,
} from "@/lib/seo";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    absolute: SEO.title,
  },
  description: SEO.description,
  keywords: [...SEO.keywords],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "FoodBaba",
    title: SEO.title,
    description: SEO.description,
    images: [
      {
        url: "/images/foddbaba-logo.webp",
        width: 512,
        height: 512,
        alt: "FoodBaba — free QR menu and billing for QSR and food carts",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: SEO.title,
    description: SEO.description,
    images: ["/images/foddbaba-logo.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
  category: "business",
};

/** Public marketing page — no auth cookies, safe to prerender for SEO. */
export const dynamic = "force-static";

export default function HomePage() {
  const jsonLd = [
    buildSoftwareJsonLd(siteUrl),
    buildOrganizationJsonLd(siteUrl),
    buildWebSiteJsonLd(siteUrl),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MerchantStartProvider>
        <HomeLanding />
      </MerchantStartProvider>
    </>
  );
}
