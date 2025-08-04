import { z } from 'zod';

export const QUERY_CHALLENGES_TOOL_OUTPUT_SCHEMA = z.object({
  page: z.number().describe('Current page number in the paginated response'),
  nextPage: z
    .number()
    .nullable()
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
          legacy: z
            .object({
              track: z
                .string()
                .optional()
                .describe('Legacy track identifier for the challenge'),
              subTrack: z
                .string()
                .optional()
                .describe('Legacy sub-track identifier for the challenge'),
              forumId: z
                .number()
                .optional()
                .describe('Legacy forum ID for the challenge'),
              directProjectId: z
                .number()
                .optional()
                .describe('Legacy direct project ID for the challenge'),
              reviewType: z
                .string()
                .optional()
                .describe('Legacy review type for the challenge'),
              confidentialityType: z
                .string()
                .optional()
                .describe('Legacy confidentiality type for the challenge'),
              pureV5Task: z
                .boolean()
                .optional()
                .describe('Legacy pure V5 task flag for the challenge'),
              reviewScorecardId: z
                .number()
                .optional()
                .describe('Legacy review scorecard ID for the challenge'),
              screeningScorecardId: z
                .number()
                .optional()
                .describe('Legacy screening scorecard ID for the challenge'),
              selfService: z
                .boolean()
                .optional()
                .describe('Legacy self-service flag for the challenge'),
            })
            .optional(),
          description: z
            .string()
            .describe('Detailed description of the challenge'),
          descriptionFormat: z
            .string()
            .describe('Format of the description, e.g., markdown'),
          metadata: z
            .array(
              z.object({
                // Additional metadata fields can be added here
                // For example, you can include fields like 'clientId', 'prize', etc
                name: z.string().describe('Metadata name'),
                value: z.string().describe('Metadata value'),
              }),
            )
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
                      value: z.number().describe('Constraint value'),
                    }),
                  )
                  .describe('Constraints for the challenge phase'),
                actualStartDate: z
                  .string()
                  .optional()
                  .describe(
                    'Actual start date of the phase (ISO format, optional)',
                  ),
                description: z
                  .string()
                  .optional()
                  .describe('Description of the phase (optional)'),
                predecessor: z
                  .string()
                  .optional()
                  .describe('Identifier of the predecessor phase (optional)'),
                actualEndDate: z
                  .string()
                  .optional()
                  .describe(
                    'Actual end date of the phase (ISO format, optional)',
                  ),
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
          attachments: z
            .array(z.object({}).optional())
            .optional()
            .describe('Attachments associated with the challenge (optional)'),
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
              type: z.string().optional().describe('Challenge prizes currency'),
              totalPrizesInCents: z
                .number()
                .optional()
                .describe('Total prize amount in cents'),
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
                userId: z.number().describe('Unique identifier for the user'),
                placement: z.number().describe('Placement of the winner'),
              }),
            )
            .optional()
            .describe('Array of winners for the challenge (optional)'),
          createdBy: z.string().describe('User handle of the creator'),
          updatedBy: z
            .string()
            .optional()
            .describe('User handle of the last updater'),
          currentPhase: z
            .object({
              id: z.string().describe('Current phase unique identifier'),
              phaseId: z.string().describe('Current phase identifier'),
              name: z.string().describe('Current phase name'),
              duration: z
                .number()
                .describe('Current phase duration in seconds'),
              scheduledStartDate: z
                .string()
                .describe(
                  'Scheduled start date of the current phase (ISO format)',
                ),
              scheduledEndDate: z
                .string()
                .describe(
                  'Scheduled end date of the current phase (ISO format)',
                ),
              isOpen: z
                .boolean()
                .describe('Indicates if the current phase is open'),
              constraints: z
                .array(
                  z.object({
                    name: z.string().describe('Constraint name'),
                    value: z.number().describe('Constraint value'),
                  }),
                )
                .describe('Constraints for the current phase'),
              description: z
                .string()
                .optional()
                .describe('Description of the current phase (optional)'),
              actualStartDate: z
                .string()
                .optional()
                .describe(
                  'Actual start date of the current phase (ISO format)',
                ),
              predecessor: z
                .string()
                .optional()
                .describe('Identifier of the predecessor phase (optional)'),
              actualEndDate: z
                .string()
                .optional()
                .describe(
                  'Actual end date of the current phase (ISO format, optional)',
                ),
            })
            .optional()
            .describe('Current phase of the challenge (optional)'),
          currentPhaseNames: z
            .array(z.string())
            .optional()
            .describe(
              'Names of the current phases of the challenge (optional)',
            ),
          discussions: z
            .array(
              z.object({
                id: z
                  .string()
                  .optional()
                  .describe('Discussion unique identifier'),
                name: z.string().optional().describe('Discussion name'),
                type: z.string().optional().describe('Discussion type'),
                provider: z.string().optional().describe('Discussion provider'),
                url: z.string().optional().describe('URL of the discussion'),
              }),
            )
            .optional()
            .describe('Discussions associated with the challenge (optional)'),
          events: z
            .array(z.object({}))
            .optional()
            .describe('Events associated with the challenge (optional)'),
          groups: z
            .array(z.object({}))
            .optional()
            .describe('Groups associated with the challenge (optional)'),
          legacyId: z
            .number()
            .optional()
            .describe('Legacy identifier for the challenge (optional)'),
          projectId: z
            .number()
            .optional()
            .describe('Project identifier for the challenge (optional)'),
          numOfCheckpointSubmissions: z
            .number()
            .optional()
            .describe(
              'Number of checkpoint submissions for the challenge (optional)',
            ),
          task: z
            .object({
              isTask: z
                .boolean()
                .describe('Indicates if the challenge is a task'),
              isAssigned: z
                .boolean()
                .describe('Indicates if the task is assigned'),
              memberId: z
                .number()
                .describe('Member ID of the assigned user (optional)'),
            })
            .optional()
            .describe('Task information for the challenge (optional)'),
        })
        .describe('Challenge object'),
    )
    .describe('Array of challenges'),
});
