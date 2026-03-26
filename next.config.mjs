/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // Compatibilidade com Vercel e Cloudflare
  experimental: {
    isrMemoryCacheSize: 0,
  },
}

export default nextConfig
