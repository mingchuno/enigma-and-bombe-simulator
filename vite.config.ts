import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      injectRegister: "script",
      // Activate updates after every app window closes, preserving in-memory work.
      registerType: "prompt",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "./",
        name: "Enigma & Bombe — The cipher workbench",
        short_name: "Enigma & Bombe",
        description:
          "Explore Enigma encryption and Bombe-inspired codebreaking offline.",
        lang: "en",
        start_url: "./",
        scope: "./",
        display: "standalone",
        theme_color: "#eee7d5",
        background_color: "#eee7d5",
        icons: [
          {
            src: "pwa-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff,woff2,png,svg}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
    }),
  ],
});
