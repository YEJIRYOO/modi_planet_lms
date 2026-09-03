import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // 바이브 코딩 백엔드(ai.modiplanet)로 프록시.
      // 브라우저는 localhost 로만 말하고 Vite 가 서버사이드로 넘겨줘서 CORS 문제가 없다.
      '/agent': {
        target: 'https://ai.modiplanet.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
