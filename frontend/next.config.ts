import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
