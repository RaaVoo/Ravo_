// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/messages": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
       "/chatbot": {
        target: "http://localhost:3000", // ✅ 백엔드 주소 동일
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
