import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Other lockfiles exist higher up the tree; pin the workspace root to this app.
  turbopack: { root: __dirname },
};

export default nextConfig;
