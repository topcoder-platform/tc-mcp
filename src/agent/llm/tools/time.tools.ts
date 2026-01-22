import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const getCurrentTimeTool = new DynamicStructuredTool({
  name: 'get_current_time',
  description: 'Get the current date and time. Optionally specify a timezone.',
  schema: z.object({
    timezone: z.string().optional().describe('The timezone to return the time in, e.g., "America/New_York". Defaults to UTC.'),
  }) as any,
  func: async ({ timezone: tz }) => {
    const now = tz ? dayjs().tz(tz) : dayjs().utc();
    return JSON.stringify({
      iso: now.toISOString(),
      formatted: now.format('YYYY-MM-DD HH:mm:ss Z'),
      timezone: tz || 'UTC',
      dayOfWeek: now.format('dddd'),
    });
  },
});

export const getCalendarRangeTool = new DynamicStructuredTool({
  name: 'get_calendar_range',
  description: 'Calculate the start and end dates for a relative calendar period (e.g., last week, last month).',
  schema: z.object({
    period: z.enum([
      'today', 'yesterday', 'tomorrow',
      'this_week', 'last_week', 'next_week',
      'this_month', 'last_month', 'next_month',
      'this_year', 'last_year', 'next_year',
      'this_quarter', 'last_quarter'
    ]).describe('The relative period to calculate.'),
    timezone: z.string().optional().describe('The timezone for the calculation. Defaults to UTC.'),
    base_date: z.string().optional().describe('Optional ISO date string to use as the "current" date anchor. Defaults to now.'),
  }) as any,
  func: async ({ period, timezone: tz, base_date }) => {
    const current = base_date ? dayjs(base_date) : dayjs();
    const anchor = tz ? current.tz(tz) : current.utc();
    
    let start, end;

    switch (period) {
      case 'today':
        start = anchor.startOf('day');
        end = anchor.endOf('day');
        break;
      case 'yesterday':
         start = anchor.subtract(1, 'day').startOf('day');
         end = anchor.subtract(1, 'day').endOf('day');
         break;
      case 'tomorrow':
         start = anchor.add(1, 'day').startOf('day');
         end = anchor.add(1, 'day').endOf('day');
         break;
      case 'this_week':
        // Prompt says: "from the most recent Sunday 00:00:00 through the current moment"
        // But usually ranges are full weeks. Let's return full week Sunday-Saturday to match generic logic, 
        // or prompt instructions.
        // Prompt: "This week" - from the most recent Sunday 00:00:00 through the current moment
        start = anchor.startOf('week'); // Sunday by default in dayjs en locale
        end = anchor; // "Current moment" per prompt
        break;
      case 'last_week':
        // Prompt: "previous full calendar week", Sunday to Saturday
        start = anchor.subtract(1, 'week').startOf('week');
        end = anchor.subtract(1, 'week').endOf('week');
        break;
      case 'next_week':
        start = anchor.add(1, 'week').startOf('week');
        end = anchor.add(1, 'week').endOf('week');
        break;
      case 'this_month':
        start = anchor.startOf('month');
        end = anchor; // "Current moment" usually implied if "this week" logic holds, but standards vary. Let's return full month end for utility? 
        // Prompt for "Last month" says "full calendar month".
        // Let's stick to full month for 'this_month' unless strictly asked. 
        // Actually, for "this month" queries usually mean "so far". 
        // But let's return full month range, user can filter.
        end = anchor.endOf('month'); 
        break;
      case 'last_month':
        start = anchor.subtract(1, 'month').startOf('month');
        end = anchor.subtract(1, 'month').endOf('month');
        break;
      case 'next_month':
        start = anchor.add(1, 'month').startOf('month');
        end = anchor.add(1, 'month').endOf('month');
        break;
      case 'this_year':
        start = anchor.startOf('year');
        end = anchor.endOf('year');
        break;
      case 'last_year':
        start = anchor.subtract(1, 'year').startOf('year');
        end = anchor.subtract(1, 'year').endOf('year');
        break;
      case 'next_year':
        start = anchor.add(1, 'year').startOf('year');
        end = anchor.add(1, 'year').endOf('year');
        break;
       case 'this_quarter':
        // Manual calculation to avoid adding quarterOfYear plugin
        const qStartMonth = Math.floor(anchor.month() / 3) * 3;
        start = anchor.month(qStartMonth).startOf('month');
        end = anchor.month(qStartMonth + 2).endOf('month');
        break;
       case 'last_quarter':
         const lastQAnchor = anchor.subtract(3, 'months');
         const lqStartMonth = Math.floor(lastQAnchor.month() / 3) * 3;
         start = lastQAnchor.month(lqStartMonth).startOf('month');
         end = lastQAnchor.month(lqStartMonth + 2).endOf('month');
         break;
    }
    
    // Safety fallback if start/end undefined
    if (!start || !end) {
        start = anchor.startOf('day');
        end = anchor.endOf('day');
    }

    return JSON.stringify({
      period,
      start: start.toISOString(),
      end: end.toISOString(),
      timezone: tz || 'UTC',
    });
  },
});
