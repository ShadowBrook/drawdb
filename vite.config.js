import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

// Copy font files from node_modules to dist/assets so CSS url() references resolve.
function copyFontsPlugin() {
  return {
    name: 'copy-fonts',
    closeBundle() {
      const targets = [
        { src: resolve('node_modules/bootstrap-icons/font/fonts'), dest: resolve('dist/assets/fonts') },
        { src: resolve('node_modules/@fortawesome/fontawesome-free/webfonts'), dest: resolve('dist/assets/webfonts') },
      ]
      for (const { src, dest } of targets) {
        if (existsSync(src)) {
          if (!existsSync(dest)) mkdirSync(dest, { recursive: true })
          cpSync(src, dest, { recursive: true, force: true })
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), copyFontsPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@douyinfe/semi-ui') || id.includes('@douyinfe/semi-icons') || id.includes('@douyinfe/semi-illustrations')) return 'vendor-semi';
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'vendor-editor';
            if (id.includes('node-sql-parser') || id.includes('oracle-sql-parser')) return 'vendor-sql';
            if (id.includes('jspdf')) return 'vendor-pdf';
            if (id.includes('lexical')) return 'vendor-lexical';
            if (id.includes('dexie')) return 'vendor-db';
            if (id.includes('i18next')) return 'vendor-i18n';
            if (id.includes('framer-motion') || id.includes('lottie-web')) return 'vendor-anim';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('lodash') || id.includes('luxon') || id.includes('axios') || id.includes('jszip') || id.includes('uuid') || id.includes('nanoid')) return 'vendor-utils';
            if (id.includes('react-dom') || id.includes('scheduler')) return 'vendor-react';
            if (id.includes('html-to-image') || id.includes('html2canvas')) return 'vendor-image';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('react-tweet')) return 'vendor-tweet';
            if (id.includes('dbml') || id.includes('@dbml')) return 'vendor-dbml';
            if (id.includes('file-saver') || id.includes('usehooks-ts') || id.includes('react-hotkeys-hook')) return 'vendor-misc';
            return 'vendor';
          }
        },
      },
    },
  },
})
