import { z } from 'zod';

export const QUERY_CHALLENGES_TOOL_PARAMETERS = z.object({
  id: z.string().optional().describe('Filter by challenge ID, exact match.'),
  status: z
    .enum([
      'New',
      'Draft',
      'Cancelled',
      'Active',
      'Completed',
      'Deleted',
      'Cancelled - Failed Review',
      'Cancelled - Failed Screening',
      'Cancelled - Zero Submissions',
      'Cancelled - Winner Unresponsive',
      'Cancelled - Client Request',
      'Cancelled - Requirements Infeasible',
      'Cancelled - Zero Registrations',
    ])
    .optional()
    .describe('Filter by challenge status'),
  type: z
    .string()
    .optional()
    .describe('Filter by type abbreviation, exact match.'),
  track: z
    .string()
    .optional()
    .describe(
      'Filter by track, case-insensitive, partial matches are allowed.',
    ),
  tag: z
    .string()
    .optional()
    .describe(
      'Filter by tag name, case-insensitive, partial matches are allowed.',
    ),
  search: z
    .string()
    .optional()
    .describe(
      'Filter by name, description and tags fields, case-insensitive, partial matches are allowed.',
    ),
  startDateStart: z
    .string()
    .optional()
    .describe('Filter by start date (lower bound of date range, ISO format)'),
  startDateEnd: z
    .string()
    .optional()
    .describe('Filter by start date (upper bound of date range, ISO format)'),
  currentPhaseName: z
    .string()
    .optional()
    .describe('Filter by current phase name.'),
  sortBy: z
    .enum([
      'updatedBy',
      'updated',
      'createdBy',
      'created',
      'endDate',
      'startDate',
      'projectId',
      'name',
      'typeId',
      'numOfRegistrants',
      'numOfSubmissions',
      'status',
      'overview.totalPrizes',
    ])
    .optional()
    .describe('Sort challenges by a specific field'),
  sortOrder: z.enum(['asc', 'desc']).optional().describe('Sort order'),
  totalPrizesFrom: z
    .number()
    .optional()
    .describe('Filter by the lowest amount of total prizes on the challenge'),
  totalPrizesTo: z
    .number()
    .optional()
    .describe('Filter by the highest amount of total prizes on the challenge'),
  createdBy: z
    .string()
    .optional()
    .describe('Filter by the user who created the challenge'),
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
    .describe('Number of challenges per page, between 1 and 100'),
});
