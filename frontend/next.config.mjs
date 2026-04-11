/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: false,
  env: {
    DATA_DIR: process.env.DATA_DIR || undefined,
    AGENT_URL: process.env.AGENT_URL || "http://localhost:3000",
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL || process.env.AGENT_URL || "http://localhost:3000",
  },
};

export default nextConfig;
