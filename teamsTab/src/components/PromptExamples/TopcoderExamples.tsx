
import {
  DocumentSearch24Regular,
  Code24Regular,
  BranchCompare24Regular,
  Bot24Regular,
} from '@fluentui/react-icons';

export const topcoderCapabilities = [
  {
    icon: <DocumentSearch24Regular />,
    title: 'Challenge Information',
    description:
      'Search for and provide details about various Topcoder challenges. Find challenges by specific criteria such as technology, skill level, or timeframe.',
    prompt: "Find challenges with 'React' and a prize over $1000",
  },
  {
    icon: <Code24Regular />,
    title: 'Skill Exploration',
    description:
      'Explore the standardized skills recognized on the Topcoder platform. Understand what skills are in demand or required for specific challenges.',
    prompt: "What skills are available related to 'AI'?",
  },
  {
    icon: <BranchCompare24Regular />,
    title: 'Comparative Reporting',
    description:
      'Get insights into current trends in challenges or skills on the platform. Request complex reports that require multiple tool calls to compare different sets of data.',
    prompt: 'Compare active vs completed challenges this month',
  },
  {
    icon: <Bot24Regular />,
    title: 'Platform Guidance',
    description:
      'Receive general guidance about how the Topcoder platform works, including information about challenge types, participation processes, and best practices.',
    prompt: 'How do I get started on Topcoder?',
  },
];

export const topcoderDescription =
  "I'm your AI-Powered Topcoder Assistant, I have direct access to the Topcoder platform. Leverage my tools to find challenges, analyze skills, and get data-driven insights. To get started, what aspect of Topcoder are you most interested in learning about?";
