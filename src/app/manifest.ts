import type { MetadataRoute } from "next";
import { PRODUCT_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_NAME,
    short_name: PRODUCT_NAME,
    description:
      "Free QR menu, ordering, and billing for QSR, cafes, and food carts.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1ea",
    theme_color: "#a65d37",
    lang: "en",
    categories: ["business", "food", "productivity"],
    icons: [
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
