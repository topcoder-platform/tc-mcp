import { z } from 'zod';

export const FUZZY_MATCH_SKILLS_TOOL_PARAMETERS = z.object({
  term: z.string().min(1).describe('Required term to search for'),
  size: z
    .number()
    .int()
    .gte(1)
    .lte(10)
    .default(10)
    .optional()
    .describe('Maximum number of fuzzy matches to return (default 10)'),
});
