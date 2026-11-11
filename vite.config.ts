import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { cvMasterBackendPlugin } from "./server/vitePlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), cvMasterBackendPlugin()],
    define: {
      "process.env": JSON.stringify({
        VITE_GEMINI_API_KEY: env.VITE_GEMINI_API_KEY || "",
        VITE_GEMINI_MODEL: env.VITE_GEMINI_MODEL || "",
        VITE_PDF_API_URL: env.VITE_PDF_API_URL || "",
        NODE_ENV: mode,
      }),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: "./src/test/setup.ts",
    },
  };
});
