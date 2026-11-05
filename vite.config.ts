import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    // 8080 fica para o emulador do Firestore.
    port: 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    VitePWA({
      // A nova versão espera um toque: veja AtualizacaoApp.
      registerType: "prompt",
      includeAssets: ["logo.svg", "favicon-32.png", "apple-touch-icon.png"],
      manifest: {
        name: "Diário de Academia",
        short_name: "Diário",
        description: "Seu treino, sua evolução, seus resultados.",
        lang: "pt-BR",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        background_color: "#17171a",
        theme_color: "#17171a",
        categories: ["fitness", "health"],
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Só o app: 34 MB de fotos nunca são baixados de antemão.
        globPatterns: ["**/*.{js,css,html,woff2,svg,png}"],
        // As fontes de outros alfabetos só baixam se forem usadas: não precisam ocupar o aparelho.
        globIgnores: [
          "**/exercises-img/**",
          "**/og-image.png",
          "**/placeholder.svg",
          "**/landing-treino.png",
          "**/inter-cyrillic*",
          "**/inter-greek*",
          "**/inter-vietnamese*",
        ],
        navigateFallback: "/index.html",
        runtimeCaching: [
          {
            // A foto fica guardada depois de vista uma vez, com limite de espaço.
            urlPattern: ({ url }) => url.pathname.startsWith("/exercises-img/"),
            handler: "CacheFirst",
            options: {
              cacheName: "fotos-exercicios",
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 60, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  // O catálogo tem 900 KB: como texto com JSON.parse, abre mais rápido do que como código.
  json: { stringify: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
