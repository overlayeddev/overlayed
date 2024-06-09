import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import proxyMiddleware from "./plugins/proxy-middleware.mjs";

const integrations = [
  sitemap(),
  react(),
  tailwind(),
  mdx(),
  (await import("astro-compress")).default(),
];

if (process.env.NODE_ENV !== "production") {
  integrations.push(proxyMiddleware(["/stars", "/latest", "/canary"]));
}

// https://astro.build/config
export default defineConfig({
  site: "https://overlayed.dev",
  trailingSlash: "never",
  integrations,
  server: {
    host: "0.0.0.0",
  },
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
