import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.russ.rest',
  output: 'static',
  outDir: '../dist',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  markdown: {
    shikiConfig: {
      theme: 'solarized-dark',
    },
  },
});
