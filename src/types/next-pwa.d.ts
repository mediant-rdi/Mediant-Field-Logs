declare module 'next-pwa' {
  import { NextConfig } from 'next';

  /**
   * Describes a runtime caching entry for Workbox.
   * @see https://developer.chrome.com/docs/workbox/modules/workbox-build/#type-RuntimeCaching
   */
  interface RuntimeCacheEntry {
    urlPattern: string | RegExp;
    handler: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate' | 'NetworkOnly' | 'CacheOnly';
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    options?: {
      cacheName?: string;
      expiration?: {
        maxEntries?: number;
        maxAgeSeconds?: number;
        purgeOnQuotaError?: boolean;
      };
      cacheableResponse?: {
        statuses?: number[];
        headers?: Record<string, string>;
      };
      // For other plugins, using a generic object is safer than `any`.
      plugins?: object[];
    };
  }

  interface WithPWAOptions {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    swSrc?: string;
    swDest?: string;
    // The `any[]` has been replaced with a specific type.
    runtimeCaching?: RuntimeCacheEntry[];
    buildExcludes?: string[];
  }

  function withPWA(options: WithPWAOptions): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}