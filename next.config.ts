import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public/pwa",
  sw: "/sw.js",
  scope: "/",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
  },
  serverExternalPackages: [
    "firebase-admin",
    "google-auth-library",
    "@genkit-ai/googleai",
    "@genkit-ai/next",
    "genkit",
    "@grpc/grpc-js",
    "@opentelemetry/sdk-node",
    "@opentelemetry/otlp-grpc-exporter-base",
  ],

  allowedDevOrigins: [
    // For local development
    "http://localhost:9002",
    "http://localhost:9003",
    "http://localhost:9004", // Added for the new port
    "http://localhost:*",

    // Specific IDX Preview URLs from warning (ensure both http/https for completeness, though https is typical)
    "https://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "http://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "https://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev", // Added for new port
    "http://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev", // Added for new port

    // Original broader wildcards for IDX (keeping these for general IDX usage)
    "https://idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev", // without port as subdomain
    "https://*.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "https://*.cloudworkstations.dev",
  ],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        http2: false,
        dgram: false,
        child_process: false,
        os: false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/pwa/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },
};

export default withPWA(
  withBundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
  })(nextConfig),
);
