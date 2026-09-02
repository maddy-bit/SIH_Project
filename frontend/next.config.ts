import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for a lean Docker image (see frontend/Dockerfile) -
  // bundles only the traced dependencies, not the whole node_modules tree.
  output: "standalone",
};

export default nextConfig;
