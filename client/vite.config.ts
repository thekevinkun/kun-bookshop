import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Set the dev server to run on port 3000 to match our backend CORS config
  server: {
    port: 3000,
  },
});
