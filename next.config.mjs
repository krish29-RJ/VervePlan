/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Separate production build output from the active `next dev` directory (.next)
  // so running `npm run build` never corrupts a running `npm run dev` server.
  distDir: process.env.NODE_ENV === "production" ? ".next-prod" : ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
