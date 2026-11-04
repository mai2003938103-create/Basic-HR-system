import type { NextConfig } from 'next';

// The Express API (backend) answers /api/*; the browser sees one origin, so the refresh cookie just works.
const backend = process.env.BACKEND_URL ?? 'http://localhost:4000';

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default config;
