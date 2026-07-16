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
})
