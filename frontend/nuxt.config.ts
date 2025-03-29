// https://nuxt.com/docs/api/configuration/nuxt-config
import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import iconsFile from "./public/icons.json";

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
    "@pinia/nuxt",
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
    redirectOptions: {
      login: "/",
      callback: "/confirm",
      exclude: ["/*"],
    },
  },
  app: {
    head: {
      title: "Tutor PWA",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "AI-powered Tutor PWA" },
        { name: "theme-color", content: "#ffffff" },
        { name: "msapplication-TileColor", content: "#ffffff" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/Tutor/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/Tutor/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/Tutor/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/Tutor/favicon-16x16.png",
        },
        { rel: "manifest", href: "/Tutor/site.webmanifest" },
      ],
    },
    baseURL: "/Tutor/",
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
      icons: iconsFile.icons,
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
