/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint errors will not fail production builds.
    // Run `next lint` manually during development.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb'
    }
  }
};

export default nextConfig;
