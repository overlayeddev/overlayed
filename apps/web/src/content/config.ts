import { z, defineCollection } from "astro:content";

const legal = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const blog = defineCollection({
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      customSlug: z.string(),
      pubDate: z.string(),
      ogImage: image(),
      description: z.string(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { legal, blog };
