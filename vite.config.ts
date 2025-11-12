import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check if certificate files exist
  const certPath = path.resolve(__dirname, '.cert/cert.pem');
  const keyPath = path.resolve(__dirname, '.cert/key.pem');
  const hasCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

  return {
    server: {
      // expose to LAN - allows access from other devices on the network
      host: true, // Listen on all network interfaces
      port: 8080,
      strictPort: false // Try next available port if 8080 is busy
    },
    plugins: [
      react(),
      mode === "development" && componentTagger()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
