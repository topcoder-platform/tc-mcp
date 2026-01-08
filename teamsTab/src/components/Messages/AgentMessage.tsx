import React, { useMemo, useState } from "react";
import { type AgentStatus, type Message } from "../../hooks/useChat";
import ChallengeResultCard from "./ChallengeResultCard";
import { Text, Spinner, makeStyles, Button } from "@fluentui/react-components";
import SkillResultCard from "./SkillResultCard";
import ServiceResultCard from './ServiceResultCard';
import TicketResultCard from './TicketResultCard';
import { MarkdownRenderer } from '../MarkdownRenderer';
import { ChevronUp16Filled, ChevronDown16Filled } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: {
    position: 'relative',
    display: 'flex',
    gap: '12px',
    padding: '16px 0',
    alignItems: 'flex-start',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: 0,
  },
  spinnerContainer: {
    position: 'absolute',
    top: '-12px',
    left: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
  },
  toggleButton: {
    marginLeft: 'auto',
    color: 'var(--colorBrandForeground1)',
    display: 'flex',
    gap: '4px',
    '&:hover': {
      color: 'var(--colorBrandForeground2)',
    },
  },
});

// Tools that should not display their results in the UI (used internally by agents)
const EXCLUDED_TOOLS = ['get_current_time', 'get_calendar_range'];

// const GenericResultCard: React.FC<{ data: any }> = ({ data }) => (
//   <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{JSON.stringify(data, null, 2)}</pre>
// );
// Don't render JSON output - it's too technical for end users
const GenericResultCard: React.FC<{ data: any }> = () => null;

const ExpandableMarkdown = ({
  content,
  expanded = false,
}: {
  content: string;
  expanded?: boolean;
}) => {
  const styles = useStyles();
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Split by double newlines (paragraph breaks in markdown)
  const paragraphs = content.split('\n\n').filter((p) => p.trim());
  const shouldTruncate = paragraphs.length > 3;

  // Show only first paragraph when truncated
  const displayContent =
    shouldTruncate && !isExpanded ? paragraphs[0] + '...' : content;

  return (
    <span>
      <MarkdownRenderer content={displayContent} />{' '}
      {shouldTruncate && (
        <Button
          appearance="subtle"
          onClick={() => setIsExpanded(!isExpanded)}
          className={styles.toggleButton}
        >
          {isExpanded ? (
            <>
              less
              <ChevronUp16Filled />
            </>
          ) : (
            <>
              more
              <ChevronDown16Filled />
            </>
          )}
        </Button>
      )}
    </span>
  );
};

interface AgentMessageProps {
  message: Message;
  isWorking?: boolean;
  agentStatus?: AgentStatus;
  currentTool?: string | null;
  parentContainerHeight?: number;
  isLastMsg?: boolean;
}

const AgentMessage: React.FC<AgentMessageProps> = ({
  agentStatus,
  currentTool,
  message,
  isWorking,
  parentContainerHeight,
  isLastMsg,
}) => {
  const styles = useStyles();
  const parentHalfHeight = parentContainerHeight
    ? parentContainerHeight / 2
    : undefined;
  let accumulatedOutput: string;
  let tool_results: any[];

  if (message.toolResults?.length) {
    accumulatedOutput = message.content;
    tool_results = message.toolResults ? message.toolResults : [];
  } else {
    try {
      const parsedContent = JSON.parse(message.content);
      if (
        typeof parsedContent.accumulatedOutput === 'string' &&
        Array.isArray(parsedContent.tool_results)
      ) {
        accumulatedOutput = parsedContent.accumulatedOutput;
        tool_results = parsedContent.tool_results;
      } else {
        accumulatedOutput = message.content;
        tool_results = [];
      }
    } catch (e) {
      accumulatedOutput = message.content;
      tool_results = [];
    }
  }

  // Memoize the parsed data map at the top level
  const toolDataMap = useMemo(() => {
    return (tool_results || []).reduce(
      (acc, result) => {
        try {
          const toolName = result.toolName;
          let parsedData;
          if (
            result.data &&
            result.data[0] &&
            typeof result.data[0].text === 'string'
          ) {
            parsedData = JSON.parse(result.data[0].text);
          } else {
            parsedData = result.data;
          }
          if (!acc[toolName]) acc[toolName] = [];
          acc[toolName].push(parsedData);
        } catch (e) {
          console.error(
            `Failed to parse tool result data for ${result.toolName}:`,
            e,
          );
        }
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }, [tool_results.length]);

  // Build the final content elements for rendering
  const contentElements: React.ReactNode[] = [];
  if (accumulatedOutput) {
    const regex = /{{\s*([a-zA-Z0-9_-]+)\s*}}/g;
    const matches = [...accumulatedOutput.matchAll(regex)];
    let hasToolData = false;
    let lastIndex = 0;
    const toolRenderIndexMap: Record<string, number> = {};

    for (const match of matches) {
      const textBefore = accumulatedOutput.substring(lastIndex, match.index);
      if (textBefore) {
        contentElements.push(
          <MarkdownRenderer key={`text-${lastIndex}`} content={textBefore} />,
        );
      }

      const toolName = match[1];
      if (toolRenderIndexMap[toolName] === undefined)
        toolRenderIndexMap[toolName] = 0;

      const currentIndex = toolRenderIndexMap[toolName];
      const toolData = (toolDataMap[toolName] || [])[currentIndex];

      // Skip rendering for excluded tools (they're used internally)
      if (EXCLUDED_TOOLS.includes(toolName)) {
        toolRenderIndexMap[toolName]++;
        lastIndex = match.index! + match[0].length;
        continue;
      }

      if (toolData) {
        hasToolData = true;
        switch (toolName) {
          case 'query-tc-challenges':
            contentElements.push(
              <ChallengeResultCard
                key={`tool-${toolName}-${match.index}`}
                data={toolData}
                compMaxHeight={parentHalfHeight}
              />,
            );
            break;
          case 'query-tc-skills':
            contentElements.push(
              <SkillResultCard
                key={`tool-${toolName}-${match.index}`}
                skills={toolData}
                compMaxHeight={parentHalfHeight}
              />,
            );
            break;
          case 'get_services_by_type':
            contentElements.push(
              <ServiceResultCard
                key={`tool-${toolName}-${match.index}`}
                services={toolData}
                compMaxHeight={parentHalfHeight}
              />,
            );
            break;
          case 'get_all_tickets':
          case 'get_all_tickets_with_status':
          case 'get_all_tickets_with_status_for_circuitId':
          case 'get_all_tickets_with_date_between':
          case 'get_all_open_tickets_with_date_before':
          case 'get_all_open_tickets_date_after':
            contentElements.push(
              <TicketResultCard
                key={`tool-${toolName}-${match.index}`}
                tickets={toolData}
                compMaxHeight={parentHalfHeight}
              />,
            );
            break;
          default:
            contentElements.push(
              <GenericResultCard
                key={`tool-${toolName}-${match.index}`}
                data={toolData}
              />,
            );
            break;
        }
        toolRenderIndexMap[toolName]++;
      }
      lastIndex = match.index! + match[0].length;
    }

    const textAfter = accumulatedOutput.substring(lastIndex);
    if (textAfter) {
      contentElements.push(
        <ExpandableMarkdown
          key="text-last"
          content={textAfter}
          expanded={isLastMsg || isWorking || !hasToolData}
        />,
      );
    }
  }

  const renderStatusIndicator = () => {
    const getStatusText = (): string => {
      switch (agentStatus) {
        case 'thinking':
          return 'Thinking...';
        case 'streaming_text':
          return 'Generating response...';
        case 'calling_tool':
          return currentTool
            ? `Calling Tool: ${currentTool}...`
            : 'Calling a tool...';
        case 'processing_tool_result':
          return 'Processing results...';
        default:
          return 'Processing...'; // A safe default
      }
    };
    return (
      <div className={styles.spinnerContainer}>
        <Spinner size="extra-small" />
        <Text
          style={{ fontSize: '13px', color: 'var(--colorNeutralForeground3)' }}
        >
          {getStatusText()}
        </Text>
      </div>
    );
  };

  return (
    <div className={styles.root}>
      {isWorking && renderStatusIndicator()}
      <div className={styles.content}>{contentElements}</div>
    </div>
  );
};

export default AgentMessage;
