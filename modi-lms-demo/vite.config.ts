import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/agent": {
        target: "https://ai.modiplanet.com",
        changeOrigin: true,
        secure: true,
        // 경로는 유지 → /agent/chat 그대로 전달 (ai.modiplanet 이 /agent 프리픽스를 떼고 앱에 넘김)
      },
    },
  },
});
