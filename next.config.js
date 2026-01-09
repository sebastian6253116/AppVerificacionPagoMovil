/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost'],
  },
  // Optimización para Vercel
  output: 'standalone',
}

module.exports = nextConfig