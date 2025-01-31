import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import proxyMiddleware from "./plugins/proxy-middleware.js";
import { targetBlank } from "./plugins/target-blank.js";
import tailwindcss from "@tailwindcss/vite";

const integrations = [sitemap(), react(), mdx()];

if (process.env.NODE_ENV !== "production") {
  integrations.push(
    // NOTE: this will proxy requests to the local wrapped server
    // and it can be ran with pnpm start:mocked to use the mocks
    // folder so you don't have to run the server locally
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
    // NOTE: using this port cause discord had it set for streamkit RPC Origin of http://localhost:3000
    port: 3000,
  },

  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),

  markdown: {
    rehypePlugins: [targetBlank],
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
