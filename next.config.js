/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  // Optimización para despliegues en Docker/Vercel
  output: 'standalone',
}

module.exports = nextConfig
