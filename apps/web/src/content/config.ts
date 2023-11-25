import { z, defineCollection } from "astro:content";

const legal = defineCollection({
  schema: z.object({}),
});

export const collections = { legal };
