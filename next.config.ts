import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify (@netlify/plugin-nextjs) publica `.next` y exige el árbol standalone.
  output: "standalone",
};

export default nextConfig;
