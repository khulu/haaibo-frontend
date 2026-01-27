import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import path from "path"; // ⬅️ Needed for path resolution

export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    proxy: {
      // Proxy API calls to the backend to avoid CORS during development
      '/api': {
        target: 'http://localhost:5251',
        changeOrigin: true,
        secure: false,
      },
      // Proxy static logos served by the backend
      '/logos': {
        target: 'http://localhost:5251',
        changeOrigin: true,
        secure: false,
      },
      '/uploads/': {
        target: 'http://localhost:5251',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      "@hooks": path.resolve(__dirname, "src/hooks"),
      "@components": path.resolve(__dirname, "src/components"),
      "@utils": path.resolve(__dirname, "src/utils"),
      "@assets": path.resolve(__dirname, "src/assets"),
      "@api": path.resolve(__dirname, "src/api"),
    },
  },
});
