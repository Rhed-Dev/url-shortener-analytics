import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep native/server-only packages out of the bundler.
  serverExternalPackages: ["@prisma/client", "ioredis"],
  poweredByHeader: false,
};

export default nextConfig;
