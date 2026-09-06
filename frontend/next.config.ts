import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only use standalone output when explicitly requested (e.g. for Docker)
  ...(process.env.NEXT_OUTPUT_STANDALONE === "true" ? { output: "standalone" } : {}),
};

export default nextConfig;
