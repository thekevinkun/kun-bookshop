import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer"; // shows what's in the bundle

export default defineConfig({
  plugins: [
    react(),
    // Generates stats.html in the project root after every build
    // Open it in a browser to see a treemap of every package and its size
    // Only runs during build, never in dev
    visualizer({
      open: false, // don't auto-open — just generate the file
      filename: "stats.html", // output file at client/stats.html
      gzipSize: true, // show gzip size (what the browser actually downloads)
      brotliSize: true, // show brotli size too (used by most modern CDNs)
    }),
  ],
  server: {
    // Set the dev server to run on port 3000 to match our backend CORS config
    port: 3000,
  },
});
