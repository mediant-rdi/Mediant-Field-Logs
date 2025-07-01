// next.config.ts

import withPWA from 'next-pwa';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  
  // --- START: Added Image Configuration ---
  // This allows the Next.js <Image> component to load images from your Convex backend.
  // The wildcard hostname '*.convex.cloud' is a secure and flexible way to
  // allow images from both your development and production projects.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.convex.cloud',
      },
    ],
  },
  // --- END: Added Image Configuration ---

  // Add other Next.js config here if needed
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // Your PWA runtimeCaching config remains unchanged.
  runtimeCaching: [
    {
      urlPattern: /\.(?:woff2?|png|jpg|jpeg|gif|svg|ico)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'convex-api',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
      },
    },
  ],
})(nextConfig);