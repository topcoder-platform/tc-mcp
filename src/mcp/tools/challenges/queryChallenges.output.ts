import { z } from 'zod';

export const QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA = z.object({
  page: z.number().describe('Current page number in the paginated response'),
  nextPage: z
    .number()
    .optional()
    .describe('Next page number, if available in the paginated response'),
  pageSize: z
    .number()
    .describe('Number of challenges per page in the paginated response'),
  total: z.number().describe('Total number of challenges matching the query'),
  data: z
    .array(
      z
        .object({
          id: z.string().describe('Unique identifier for the challenge'),
          name: z.string().describe('Challenge title'),
          typeId: z.string().describe('Type identifier for the challenge'),
          trackId: z.string().describe('Track identifier for the challenge'),
          description: z
            .string()
            .describe('Detailed description of the challenge'),
          descriptionFormat: z
            .string()
            .describe('Format of the description, e.g., markdown'),
          metadata: z
            .object({
              // Additional metadata fields can be added here
              // For example, you can include fields like 'clientId', 'prize', etc
            })
            .optional()
            .describe('Optional metadata associated with the challenge'),
          timelineTemplateId: z
            .string()
            .describe(
              'Identifier for the timeline template used in the challenge',
            ),
          phases: z
            .array(
              z.object({
                id: z.string().describe('Phase unique identifier'),
                phaseId: z.string().describe('Phase identifier'),
                name: z.string().describe('Phase name'),
                duration: z.number().describe('Phase duration in seconds'),
                scheduledStartDate: z
                  .string()
                  .describe('Scheduled start date (ISO format)'),
                scheduledEndDate: z
                  .string()
                  .describe('Scheduled end date (ISO format)'),
                isOpen: z
                  .boolean()
                  .describe('Indicates if the phase is currently open'),
                constraints: z
                  .array(
                    z.object({
                      name: z.string().describe('Constraint name'),
                      value: z.string().describe('Constraint value'),
                    }),
                  )
                  .describe('Constraints for the challenge phase'),
              }),
            )
            .describe('Challenge phases (optional)'),
          terms: z
            .array(
              z.object({
                id: z.string().describe('Term unique identifier'),
                roleId: z.string().describe('Role identifier'),
              }),
            )
            .describe('Terms associated with the challenge (optional)'),
          prizeSets: z
            .array(
              z.object({
                prizes: z
                  .array(
                    z.object({
                      type: z.string().describe('Prize type'),
                      value: z.number().describe('Prize value'),
                    }),
                  )
                  .describe('Array of prizes for the challenge'),
                type: z.string().describe('Prize set type'),
                description: z
                  .string()
                  .optional()
                  .describe('Description of the prize set'),
              }),
            )
            .describe('Prize sets associated with the challenge'),
          tags: z
            .array(z.string())
            .describe('Tags associated with the challenge'),
          startDate: z.string().describe('Challenge start date (ISO format)'),
          endDate: z
            .string()
            .describe('Challenge end date (ISO format, optional)'),
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
            .describe('Current status of the challenge'),
          track: z
            .string()
            .describe('Challenge track (e.g., DEVELOPMENT, DESIGN)'),
          type: z.string().describe('Challenge type (e.g., Challenge, etc.)'),
          registrationStartDate: z
            .string()
            .optional()
            .describe('Registration start date (optional, ISO format)'),
          registrationEndDate: z
            .string()
            .optional()
            .describe('Registration end date (optional, ISO format)'),
          created: z.string().describe('Creation date (ISO format)'),
          updated: z.string().describe('Last update date (ISO format)'),
          overview: z
            .object({
              totalPrizes: z.number().describe('Total prize amount'),
              types: z.string().describe('Challenge prizes currency'),
            })
            .describe('Overview of the challenge'),
          skills: z
            .array(
              z.object({
                id: z.string().describe('Skill unique identifier'),
                name: z.string().describe('Skill name'),
                category: z
                  .object({
                    id: z.string().describe('Category unique identifier'),
                    name: z.string().describe('Category name'),
                  })
                  .describe('Category of the skill'),
              }),
            )
            .describe('Skills associated with the challenge'),
          numOfSubmissions: z
            .number()
            .describe('Number of submissions for the challenge'),
          numOfRegistrants: z
            .number()
            .describe('Number of registrants for the challenge'),
          submissionStartDate: z
            .string()
            .optional()
            .describe('Submission start date (optional, ISO format)'),
          submissionEndDate: z
            .string()
            .optional()
            .describe('Submission end date (optional, ISO format)'),
          winners: z
            .array(
              z.object({
                handle: z
                  .string()
                  .describe('Winner handle on Topcoder platform'),
                userId: z.string().describe('Unique identifier for the user'),
                placement: z.number().describe('Placement of the winner'),
              }),
            )
            .optional()
            .describe('Array of winners for the challenge (optional)'),
        })
        .describe('Challenge object'),
    )
    .describe('Array of challenges'),
});
