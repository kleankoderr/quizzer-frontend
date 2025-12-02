import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split node_modules into separate chunks by package name
          if (id.includes("node_modules")) {
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/mixpanel": {
        target: "https://api-js.mixpanel.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mixpanel/, ""),
      },
    },
  },
});
