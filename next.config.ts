import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "standalone",
  devIndicators: false,
  images: {
    remotePatterns: [
      // Firebase Storage for user-uploaded profile photos and documents
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/**",
      },
    ],
  },
  serverExternalPackages: [
    "firebase-admin",
    "google-auth-library",

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
    "http://localhost:9004",
    "http://localhost:*",

    // Specific IDX Preview URLs from warning
    "https://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "http://9003-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "https://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
    "http://9004-idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",

    // Original broader wildcards for IDX (keeping these for general IDX usage)
    "https://idx-studio-1746445170503.cluster-44kx2eiocbhe2tyk3zoyo3ryuo.cloudworkstations.dev",
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
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), browsing-topics=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' blob: data: https:",
              "font-src 'self' data: https://fonts.gstatic.com",
              // Only allow localhost connections in development
              ...(isProduction
                ? ["connect-src 'self' https://firebasestorage.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.onrender.com"]
                : ["connect-src 'self' https://firebasestorage.googleapis.com https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.cloudworkstations.dev https://*.cloudworkstations.dev http://localhost:* ws://localhost:* https://*.onrender.com"]),
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
