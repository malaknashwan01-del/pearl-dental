import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // "server-only" بيرمي خطأ برا Next، فبالاختبارات بنبدله بملف فاضي
      "server-only": path.resolve(__dirname, "src/test/empty.ts"),
    },
  },
  test: { environment: "node", testTimeout: 20000, hookTimeout: 30000 },
});
