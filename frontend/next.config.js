/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['glade-essential-sporting.ngrok-free.dev'],
  async rewrites() {
    // Proxy API calls to the FastAPI backend so the frontend can use
    // same-origin (relative) URLs. This works when served through a
    // tunnel (e.g. ngrok) where localhost is unreachable from the browser.
    return [
      { source: '/api/:path*', destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/:path*` },
      { source: '/health', destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/health` },
    ]
  },
}

module.exports = nextConfig
