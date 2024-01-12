import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import compress from "astro-compress";

import proxyMiddleware from "./plugins/proxy-middleware.mjs";

const integrations = [sitemap(), react(), tailwind(), mdx(), compress()];

if (process.env.NODE_ENV !== "production") {
  integrations.push(
    proxyMiddleware("/latest", {
      target: "http://localhost:8787",
      changeOrigin: true,
    }),
  );
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
