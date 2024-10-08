import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/static";
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import type { RehypePlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Element } from "hast";

import proxyMiddleware from "./plugins/proxy-middleware.mjs";

const integrations = [sitemap(), react(), tailwind(), mdx()];

if (process.env.NODE_ENV !== "production") {
  integrations.push(
    proxyMiddleware(["/stars", "/latest/canary", "/latest/stable"]),
  );
}

// TODO: figure out the type error
// code from: https://dan.salvagni.io/b/astro-plugin-open-external-links-in-new-tab/
export const targetBlank: RehypePlugin = ({
  domain = "overlayed.dev",
} = {}) => {
  return (tree) => {
    visit(tree, "element", (e: Element) => {
      if (
        e.tagName === "a" &&
        e.properties?.href &&
        e.properties.href.toString().startsWith("http") &&
        !e.properties.href.toString().includes(domain)
      ) {
        e.properties!["target"] = "_blank";
      }
    });
  };
};

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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    rehypePlugins: [targetBlank],
  },
});
