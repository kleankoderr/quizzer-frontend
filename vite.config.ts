import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
