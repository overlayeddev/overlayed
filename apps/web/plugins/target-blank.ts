import type { RehypePlugin } from "@astrojs/markdown-remark";
import { visit } from "unist-util-visit";
import type { Element } from "hast";

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
