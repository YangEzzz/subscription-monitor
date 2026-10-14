import { defineConfig, loadEnv, type ProxyOptions } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxy: Record<string, ProxyOptions> = {
    '/api': {
      target: env.VITE_DEV_API_TARGET || 'http://127.0.0.1:3002',
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
      configure: (server) =>
        server.on('proxyReq', (request) => {
          if (env.VITE_DEV_API_ORIGIN) {
            request.setHeader('origin', env.VITE_DEV_API_ORIGIN);
          } else {
            request.removeHeader('origin');
          }
        }),
    },
  };
  return {
    base: './',
    plugins: [vue(), tailwindcss()],
    server: {
      port: 5174,
      strictPort: true,
      proxy,
    },
    preview: { port: 4174, strictPort: true, proxy },
  };
});
