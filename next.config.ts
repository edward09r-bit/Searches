import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones/tablets on the same Wi-Fi reach the dev server via the
  // host machine's LAN IP (e.g. http://192.168.1.42:3000) — Next.js blocks
  // cross-origin dev requests by default. Covers the two most common home
  // router subnets; add your own entry here if yours differs.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*"],
};

export default nextConfig;
