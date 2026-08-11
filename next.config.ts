import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * The app is entirely client-rendered: the catalogue is fetched, and all user
   * state lives in localStorage and Firestore. Exporting it as static files
   * means it can be hosted anywhere, loads from the CDN edge, and has no server
   * to keep running.
   */
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
