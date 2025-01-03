/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['pbs.twimg.com'],
  },
}

module.exports = nextConfig 