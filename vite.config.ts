import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  server: {
    // Явно слушаем IPv4. Без этого Vite на Windows биндится только на [::1],
    // а Chrome/Edge для http://localhost/ резолвит сначала 127.0.0.1 → ERR_CONNECTION_REFUSED.
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
});
