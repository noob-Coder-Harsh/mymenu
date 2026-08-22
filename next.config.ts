import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Admin + JWKS stack external so Node can load CJS jose@5 (see package overrides).
  serverExternalPackages: ["firebase-admin", "jwks-rsa", "jose"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
