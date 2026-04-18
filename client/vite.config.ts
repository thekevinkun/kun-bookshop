import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      filename: "stats.html",
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  server: {
    port: 3000,
    // Automatically reload the page when HMR websocket loses connection
    // instead of silently leaving a broken blank page
    hmr: {
      overlay: true, // show error overlay instead of silent failure
    },
    watch: {
      // Use polling as fallback for environments where file watching drops
      usePolling: false,
    },
  },
});
