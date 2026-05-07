import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      onwarn(warning, warn) {
        if (warning.message && warning.message.includes('inlineDynamicImports')) {
          return;
        }
        warn(warning);
      },
      output: {
        format: 'cjs',
        entryFileNames: 'main.cjs',
        codeSplitting: false
      }
    },
    rollupOptions: {
      external: ['electron-squirrel-startup']
    }
  }
});
