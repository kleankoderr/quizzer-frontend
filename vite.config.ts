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
  build: {
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching and performance
        manualChunks: (id) => {
          // React core
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router-dom")
          ) {
            return "react-vendor";
          }

          // Lexical editor (large library)
          if (
            id.includes("node_modules/lexical") ||
            id.includes("node_modules/@lexical")
          ) {
            return "lexical-vendor";
          }

          // Charts library
          if (id.includes("node_modules/recharts")) {
            return "charts-vendor";
          }

          // Markdown rendering (large with syntax highlighting)
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/rehype-")
          ) {
            return "markdown-vendor";
          }

          // Data fetching and state management
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/axios")
          ) {
            return "data-vendor";
          }

          // Firebase
          if (id.includes("node_modules/firebase")) {
            return "firebase-vendor";
          }

          // Analytics
          if (id.includes("node_modules/mixpanel-browser")) {
            return "analytics-vendor";
          }

          // UI libraries
          if (
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/react-hot-toast") ||
            id.includes("node_modules/react-loading-skeleton") ||
            id.includes("node_modules/react-confetti") ||
            id.includes("node_modules/react-use")
          ) {
            return "ui-vendor";
          }

          // Date utilities
          if (id.includes("node_modules/date-fns")) {
            return "date-vendor";
          }
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
});
