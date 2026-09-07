import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Expose Maptiler API key to the browser — falls back to the default key
  // if the environment variable is not set (e.g. on fresh CI runners).
  env: {
    NEXT_PUBLIC_MAPTILER_KEY:
      process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "YNlAc2R6pThUIZrd2o5m",
  },
  ...(process.env.NEXT_OUTPUT_STANDALONE === "true" ? { output: "standalone" } : {}),
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendUrl}/ws/:path*`,
      },
      {
        source: "/evidence/:path*",
        destination: `${backendUrl}/evidence/:path*`,
      },
    ];
  },
};

export default nextConfig;
