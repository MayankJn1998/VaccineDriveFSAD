import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        port: 3000, // You can change the port if needed
        // Add proxy if you have a backend API
        // proxy: {
        //   '/api': {
        //     target: 'http://localhost:5000', // Backend server
        //     changeOrigin: true,
        //     rewrite: (path) => path.replace(/^\/api/, ''),
        //   },
        // },
      },
    });