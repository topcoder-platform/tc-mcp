import { z } from 'zod';

export const QUERY_SKILLS_TOOL_OUTPUT_SCHEMA = z.object({
  page: z.number().describe('Current page number in the paginated response'),
  pageSize: z
    .number()
    .describe(
      'Number of standardized skills per page in the paginated response',
    ),
  total: z
    .number()
    .describe('Total number of standardized skills matching the query'),
  data: z
    .array(
      z
        .object({
          id: z.string().describe('Unique identifier for the skill'),
          name: z.string().describe('Skill name'),
          description: z
            .string()
            .describe('Detailed description of the standardized skill'),
          category: z
            .object({
              id: z.string().describe('Unique identifier for the category'),
              name: z.string().describe('Category name'),
              description: z
                .string()
                .nullable()
                .optional()
                .describe('Detailed description of the category'),
            })
            .describe('Category to which the skill belongs'),
        })
        .describe('Standardized skill object'),
    )
    .describe("Array of Topcoder's standardized skills"),
});
