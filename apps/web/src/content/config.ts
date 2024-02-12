import { z, defineCollection } from "astro:content";

const legal = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    pubDate: z.string(),
    description: z.string(),
    draft: z.boolean().optional(),
  }),
});

const misc = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { legal, blog, misc };
