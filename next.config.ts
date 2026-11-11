import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.62.159.32'],

  async rewrites() {
    return {
      // Public bio pages live at /@username, but a folder named "@x" is a
      // parallel-route slot in the App Router, so the real route is /bio/[username].
      // beforeFiles: must win over the app/[shortCode] dynamic route.
      beforeFiles: [
        { source: "/@:username", destination: "/bio/:username" },
        { source: "/@:username/:path*", destination: "/bio/:username/:path*" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
