import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // قاعدة البيانات المدمجة (للتطوير) ما بتنضغط مع باقي الكود
  serverExternalPackages: ["@electric-sql/pglite", "pg"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
