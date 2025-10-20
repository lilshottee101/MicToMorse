import { defineConfig } from 'vite';
import { readFileSync } from 'fs'
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@styles': '/src/styles'
    }
  },
  plugins: [
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace (/%APP_VERSION%/g, version)	
			}
	}]
});
