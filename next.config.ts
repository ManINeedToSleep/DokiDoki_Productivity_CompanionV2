import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static file serving through the /public directory
  reactStrictMode: true,
  
  // Configure static asset handling
  images: {
    domains: ['localhost'],
    // Add any other image domains you need
  },

  // Configure webpack to handle font files
  webpack(config) {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });

    return config;
  },

  // Add custom headers for font files
  async headers() {
    return [
      {
        // Match font files in the /public/fonts directory
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
