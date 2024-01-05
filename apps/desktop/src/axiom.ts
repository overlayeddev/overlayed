import { Axiom } from "@axiomhq/js";

if (!import.meta.env.VITE_AXIOM_TOKEN) {
  throw new Error("Missing Axiom token");
}

export const axiom = new Axiom({ token: import.meta.env.VITE_AXIOM_TOKEN });
