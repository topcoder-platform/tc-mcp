import { z } from 'zod';

export const QUERY_SKILLS_TOOL_PARAMETERS = z.object({
  name: z
    .array(z.string())
    .optional()
    .describe('Filter by skill names, exact match.'),
  skillId: z
    .array(z.string().uuid())
    .optional()
    .describe('Filter by skill IDs, exact match.'),
  sortBy: z
    .enum(['name', 'description', 'created_at', 'updated_at'])
    .optional()
    .describe('Sort challenges by a specific field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  page: z
    .number()
    .gte(1)
    .default(1)
    .optional()
    .describe('Page number for pagination, starting from 1'),
  perPage: z
    .number()
    .gte(1)
    .lte(100)
    .default(20)
    .optional()
    .describe('Number of standardized skills per page, between 1 and 100'),
});
