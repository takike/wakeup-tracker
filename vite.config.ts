import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Actions (Pagesデプロイ) の場合は '/wakeup-tracker/'、それ以外のローカル/Capacitorビルドでは相対パス './' を使用します
  base: process.env.GITHUB_ACTIONS === 'true' ? '/wakeup-tracker/' : './',
})
