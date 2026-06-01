import { z } from 'zod';

export const citationSchema = z.object({
  title: z.string(),
  route: z.string().optional(),
  sourcePath: z.string(),
  sectionHeading: z.string().optional(),
});

export type Citation = z.infer<typeof citationSchema>;
