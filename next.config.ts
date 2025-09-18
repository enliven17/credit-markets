import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      "images.unsplash.com",
      "api.dicebear.com",
      "flowscan.org",
      "avatars.githubusercontent.com",
      "res.cloudinary.com",
    ],
  },
  env: {
    NEXT_PUBLIC_FLOW_NETWORK: process.env.NEXT_PUBLIC_FLOW_NETWORK || "testnet",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    NEXT_PUBLIC_FUNGIBLE_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet" 
      ? "0xf233dcee88fe0abe" 
      : "0x9a0766d93b6608b7",
    NEXT_PUBLIC_FLOW_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet"
      ? "0x1654653399040a61"
      : "0x7e60df042a9c0868",
  },
  webpack: (config, { isServer }) => {
    // Add the Cadence loader first
    config.module.rules.push({
      test: /\.cdc$/,
      type: 'asset/source',
    });

    // Add alias configuration
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@flow-wager': path.resolve(__dirname, 'flow-wager'),
    };

    // Only add fallback for client-side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx']
};

export default nextConfig;