import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solidity imports are read dynamically by the compiler route, so static
  // output tracing cannot discover them on its own. Ship the package sources
  // with that route in production (for example, Vercel serverless functions).
  outputFileTracingIncludes: {
    "/api/compile": ["./node_modules/@openzeppelin/contracts/**/*"],
  },
};

export default nextConfig;
