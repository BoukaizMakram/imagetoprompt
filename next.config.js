/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/image-to-prompt",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
