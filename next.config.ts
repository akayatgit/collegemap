import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfkit", "undici"],
  outputFileTracingIncludes: {
    "/api/leads": ["./node_modules/pdfkit/**/*"],
  },
};

export default nextConfig;
