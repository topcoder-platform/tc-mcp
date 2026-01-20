
import {
  Globe24Regular,
  TicketDiagonal24Regular,
  Wrench24Regular,
  DocumentText24Regular,
} from '@fluentui/react-icons';

export const zayoCapabilities = [
  {
    icon: <Globe24Regular />,
    title: 'Service Discovery',
    description:
      'Find and check details of your Zayo services like Dark Fiber, Ethernet, and Circuits. Check their status and location.',
    prompt: "Show me all my Dark Fiber circuits.",
  },
  {
    icon: <TicketDiagonal24Regular />,
    title: 'Ticket Management',
    description:
      'Manage your support tickets. List open tickets, filter by date, view details, create new tickets, or add comments.',
    prompt: "Show me all my open tickets.",
  },
  {
    icon: <Wrench24Regular />,
    title: 'Maintenance Updates',
    description:
      'Stay informed about maintenance events affecting your services. Check for current impacts or planned future work.',
    prompt: "Are there any maintenance events affecting me right now?",
  },
  {
    icon: <DocumentText24Regular />,
    title: 'Quoting & Ordering',
    description:
      'Generate quotes for new services. Validate addresses, find locations, and create quotes for IP DIA or E-Line services.',
    prompt: "I want a quote for 10Gbps Internet at 123 Main St, Denver.",
  },
];

export const zayoDescription =
  "I'm your Zayo Network Assistant, I can help you manage your Zayo services. From tracking tickets and maintenance to discovering services and generating quotes, I'm here to assist with your network needs.";
