/** @type {import('next').NextConfig} */
const nextConfig = {
  // The Services page was removed; send old links to the homepage.
  async redirects() {
    return [{ source: "/services", destination: "/", permanent: true }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
    ],
  },
};

export default nextConfig;
