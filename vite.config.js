import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [
      react(),
      !isProduction &&
        checker({
          eslint: {
            lintCommand: 'eslint "./src/**/*.{js,jsx,ts,tsx}"',
          },
          overlay: {
            initialIsOpen: false,
          },
        }),
    ].filter(Boolean),

    resolve: {
      alias: [
        {
          find: /^~(.+)/,
          replacement: path.join(process.cwd(), 'node_modules/$1'),
        },
        {
          find: /^src(.+)/,
          replacement: path.join(process.cwd(), 'src/$1'),
        },
      ],
    },
    server: {
      port: 3030,
      strictPort: true,
      host: true,
      origin: 'http://0.0.0.0:3030',
    },
    preview: {
      port: 3030,
    },
    build: {
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
    },
  };
});