import { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config: any) => {
    config.resolve.fallback = { fs: false };
    return config;
  },
  images: {
    domains: ['localhost'],
  }
};

export default nextConfig;
