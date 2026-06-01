import { z } from 'zod';

export const suggestionSchema = z.object({
  label: z.string(),
  prompt: z.string(),
});

export type Suggestion = z.infer<typeof suggestionSchema>;
