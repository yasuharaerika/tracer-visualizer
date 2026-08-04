import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'data/*', dest: '.' },
      ],
    }),
  ],
  base: './', // 使用相对路径，支持 GitHub Pages 子路径部署
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    devSourcemap: true,
    transformer: 'postcss',
  },
  server: {
    port: 5173,
    open: true,
  },
  publicDir: 'public',
  build: {
    cssMinify: 'esbuild',
  },
})
