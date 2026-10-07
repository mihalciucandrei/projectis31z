/** @type {import('next').NextConfig} */
// Браузер ходит только на тот же origin (/api, /uploads): Next проксирует запросы в backend.
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
};
