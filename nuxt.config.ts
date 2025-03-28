// https://nuxt.com/docs/api/configuration/nuxt-config
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";

const sw = process.env.SW === "true";

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  ssr: false,
  modules: [
    "@nuxtjs/supabase",
    "@vite-pwa/nuxt",
    "@nuxt/eslint",
    "@nuxt/content",
    "@tailwindcss/postcss",
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  app: {
    head: {
      title: "Tutor PWA",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "AI-powered Tutor PWA" },
      ],
    },
  },
  // @ts-ignore
  pwa: {
    strategies: sw ? "injectManifest" : "generateSW",
    srcDir: sw ? "service-worker" : undefined,
    filename: sw ? "sw.ts" : undefined,
    registerType: "autoUpdate",
    manifest: {
      name: "Tutor PWA",
      short_name: "Tutor",
      description: "AI-powered Tutor Application",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      icons: [
        {
          src: "/PWAIcons/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/PWAIcons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/PWAIcons/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
    },
  },
  // @ts-ignore
  workbox: {
    globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
  },
  injectManifest: {
    globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
  },
  typescript: {
    strict: true,
  },
  // Optional UI configuration

  css: ["~/assets/css/main.css"],
});
