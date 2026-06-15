import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
  build: {
    // Split large shared libraries into their own long-cached vendor chunks so
    // they aren't bundled into the main entry (and are reused across pages).
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-") || id.includes("victory-vendor")) return "charts";
          if (id.includes("lucide-react")) return "icons";
          if (id.includes("react-router") || id.includes("react-dom") || /node_modules\/react\//.test(id)) return "react-vendor";
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
});