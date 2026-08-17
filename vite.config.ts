import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 生成 gzip 压缩文件
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024, // 超过1KB就压缩
    }),
    viteStaticCopy({
      targets: [
        { src: 'data/*', dest: '.' },
        { src: 'favicon.svg', dest: '.' },
      ],
    }),
  ],
  base: '/tracer-visualizer/', // 固定路径，支持 GitHub Pages 子路径部署
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
    minify: 'esbuild',
    rollupOptions: {
      input: './index.html',
    },
    assetsInlineLimit: 0, // 不内联小文件，确保SVG等资源正确输出
  },
})
