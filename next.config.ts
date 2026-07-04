import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: process.env.DOCKER_BUILD === "1",
  },
};

export default nextConfig;
