import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The Express API (backend) answers /api/*; the browser sees one origin, so the refresh cookie just works.
const backend = process.env.BACKEND_URL ?? 'http://localhost:4000';
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const config: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  turbopack: {
    root: path.resolve(projectRoot, '..'),
  },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${backend}/api/:path*` }];
  },
};

export default config;
