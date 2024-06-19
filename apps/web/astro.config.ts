import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

import proxyMiddleware from "./plugins/proxy-middleware.mjs";

const integrations = [sitemap(), react(), tailwind(), mdx()];

if (process.env.NODE_ENV !== "production") {
  integrations.push(
    proxyMiddleware(["/stars", "/latest/canary", "/latest/stable"]),
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
});
