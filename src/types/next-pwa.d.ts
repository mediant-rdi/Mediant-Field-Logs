declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface WithPWAOptions {
    dest: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    swSrc?: string;
    swDest?: string;
    runtimeCaching?: any[];
    buildExcludes?: string[];
  }

  function withPWA(options: WithPWAOptions): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
