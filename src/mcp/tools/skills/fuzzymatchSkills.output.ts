import { z } from 'zod';

export const FUZZY_MATCH_SKILLS_TOOL_OUTPUT_SCHEMA = z
  .array(
    z.object({
      id: z.string().uuid().describe('Unique identifier for the skill'),
      name: z.string().describe('Skill name'),
    }),
  )
  .describe('Array of fuzzy matched skills ordered by relevance');
