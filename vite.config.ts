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
          // Only split truly independent libraries that don't depend on React

          // Firebase (independent, large library)
          if (
            id.includes("node_modules/firebase") ||
            id.includes("node_modules/@firebase")
          ) {
            return "firebase-vendor";
          }

          // Analytics (independent)
          if (id.includes("node_modules/mixpanel-browser")) {
            return "analytics-vendor";
          }

          // Markdown rendering with syntax highlighting (large, but React-dependent)
          // Keep this separate as it's very large
          if (
            id.includes("node_modules/react-markdown") ||
            id.includes("node_modules/remark-") ||
            id.includes("node_modules/rehype-") ||
            id.includes("node_modules/katex") ||
            id.includes("node_modules/highlight.js")
          ) {
            return "markdown-vendor";
          }

          // Lexical editor (large library, React-dependent)
          if (
            id.includes("node_modules/lexical") ||
            id.includes("node_modules/@lexical")
          ) {
            return "lexical-vendor";
          }

          // React core and router - keep together
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react-vendor";
          }

          // Data fetching (React Query depends on React)
          if (
            id.includes("node_modules/@tanstack/react-query") ||
            id.includes("node_modules/@tanstack/query-core")
          ) {
            return "data-vendor";
          }

          // Axios (independent HTTP client)
          if (id.includes("node_modules/axios")) {
            return "axios-vendor";
          }

          // Date utilities (independent)
          if (id.includes("node_modules/date-fns")) {
            return "date-vendor";
          }

          // All other node_modules go into a general vendor chunk
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
  },
});
