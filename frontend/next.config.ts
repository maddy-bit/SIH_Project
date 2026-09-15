import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  ...(process.env.NEXT_OUTPUT_STANDALONE === "true" ? { output: "standalone" } : {}),
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
    return [
      // Proxy all /api/* to Spring backend EXCEPT /api/vahan/* which is a
      // Next.js native API route (frontend/src/app/api/vahan/[plate]/route.ts).
      // Next.js path regex negative lookahead syntax: (?!vahan)
      {
        source: "/api/:path((?!vahan\\/).*)",
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
