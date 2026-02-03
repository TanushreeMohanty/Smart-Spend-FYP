import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Force web to use standard lucide instead of native
      'lucide-react-native': 'lucide-react',
      // Point to your shared package
      '@shared': path.resolve(__dirname, '../../packages/shared'),
    },
  },
  optimizeDeps: {
    // Tell Vite NOT to touch these native mobile packages
    exclude: ['lucide-react-native', 'react-native-safe-area-context'],
  },
});