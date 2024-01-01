import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";

import proxyMiddleware from "./plugins/proxy-middleware.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://overlayed.dev",
  trailingSlash: "never",
  integrations: [
    // TODO: is dev only?
    proxyMiddleware("/latest", {
      target: "http://localhost:8787",
      changeOrigin: true,
    }),
    react(),
    tailwind(),
    mdx(),
  ],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
});
