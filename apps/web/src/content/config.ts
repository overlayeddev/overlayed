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
      // ogImage: image().refine((img) => img.width >= 1200, {
      //   message: "OG image must be at least 1080 pixels wide!",
      // }),
      description: z.string(),
      draft: z.boolean().optional(),
    }),
});

export const collections = { legal, blog };
