import React, { useState, useEffect } from "react";
import {
  makeStyles,
  Text,
  Body1,
  tokens,
  Accordion,
  AccordionItem,
  AccordionHeader,
  AccordionPanel,
} from '@fluentui/react-components';
import {
  DocumentSearch24Regular,
  Code24Regular,
  BranchCompare24Regular,
  Sparkle24Filled,
  ChevronRight20Regular,
  Bot24Regular,
  Toolbox24Regular,
} from '@fluentui/react-icons';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { getTools } from '../services/api';
import { MarkdownRenderer } from './MarkdownRenderer';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
    padding: '48px 0px',
    maxWidth: '1100px',
    margin: '0 auto',
    '@media (max-width: 960px)': {
      gap: '24px',
      padding: '24px 0px',
    },
  },

  headerContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '48px',
    padding: '0 24px',
    '@media (min-width: 540px) and (max-width: 960px)': {
      gap: '24px',
      padding: '0 12px',
    },
    '@media (max-width: 540px)': {
      gap: '24px',
      padding: 0,
    },
  },

  welcomeBadge: {
    padding: '8px 20px',
    borderRadius: '24px',
    display: 'flex',
    gap: '24px',
    alignSelf: 'center',
    // Base styles for animation
    opacity: 0,
    transform: 'translateY(10px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease-out',
  },

  sparkleIcon: {
    color: tokens.colorBrandForeground1,
    scale: '2',
  },

  welcomeText: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '24px',
  },

  headerDescription: {
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.6',
    // Base styles for animation
    opacity: 0,
    transform: 'translateY(10px)',
    transitionProperty: 'opacity, transform',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease-out',
    transitionDelay: '200ms',
  },

  typingCursor: {
    '&::after': {
      content: "'|'",
      animationName: 'blink',
      animationDuration: '1s',
      animationIterationCount: 'infinite',
      animationTimingFunction: 'step-end',
    },
  },

  capabilitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    '@media (max-width: 960px)': {
      gridTemplateColumns: '1fr',
    },
  },

  capabilityCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: tokens.colorNeutralBackground2,
    pointerEvents: 'none',
    position: 'relative',
    // Base styles for animation
    opacity: 0,
    transform: 'translateY(20px)',
    transitionProperty: 'opacity, transform, box-shadow, border-color',
    transitionDuration: '300ms',
    transitionTimingFunction: 'ease-out',

    '@media (min-width: 540px) and (max-width: 960px)': {
      gap: '12px',
      padding: '12px',
    },

    '@media (max-width: 540px)': {
      gap: '12px',
      padding: 0,
    },

    '&:hover': {
      '& .capability-icon': {
        transform: 'scale(1.1)',
        color: tokens.colorBrandForeground1,
      },
      '& .example-arrow': {
        transform: 'translateX(4px)',
        color: tokens.colorBrandForeground1,
      },
    },
    '&:active': {
      transform: 'translateY(-4px)',
    },
    '&:focus-visible': {
      outlineStyle: 'solid',
      outlineWidth: '2px',
      outlineColor: tokens.colorBrandStroke1,
      outlineOffset: '2px',
    },
  },

  capabilityHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },

  iconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '10px',
    backgroundColor: tokens.colorBrandBackground2,
    transitionProperty: 'all',
    transitionDuration: '250ms',
    transitionTimingFunction: 'ease-out',
  },

  capabilityIcon: {
    fontSize: '24px',
    color: tokens.colorBrandForeground1,
    transitionProperty: 'all',
    transitionDuration: '250ms',
    transitionTimingFunction: 'ease-out',
  },

  capabilityTitle: {
    fontWeight: tokens.fontWeightSemibold,
    fontSize: '17px',
    color: tokens.colorNeutralForeground1,
  },

  capabilityDescription: {
    color: tokens.colorNeutralForeground2,
    fontSize: '14px',
    lineHeight: '1.6',
    paddingLeft: '4px',
    flexGrow: 1,
  },

  exampleBlock: {
    padding: '14px 16px',
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground1,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    transitionProperty: 'all',
    transitionDuration: '200ms',
    transitionTimingFunction: 'ease-out',
    pointerEvents: 'auto',
    cursor: 'pointer',

    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      borderLeft: `3px solid ${tokens.colorBrandStroke1}`,
      transform: 'translateX(4px)',
    },
  },

  exampleContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },

  exampleLabel: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground3,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },

  exampleText: {
    color: tokens.colorNeutralForeground1,
    fontSize: '14px',
  },

  exampleArrow: {
    fontSize: '20px',
    color: tokens.colorNeutralForeground3,
    transitionProperty: 'all',
    transitionTimingFunction: 'ease-out',
  },

  toolListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
    width: '100%',
  },

  toolItem: {
    borderRadius: '8px',
    backgroundColor: tokens.colorNeutralBackground2,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    overflow: 'hidden',
    transition: 'all 0.2s ease-out',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
      // borderColor: tokens.colorNeutralStroke1Hover,
    },
  },

  toolHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    cursor: 'pointer',
    userSelect: 'none',
  },

  toolName: {
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorBrandForeground1,
    fontSize: '15px',
  },

  toolDescription: {
    padding: '0 16px 16px 16px',
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    lineHeight: '1.5',
    borderTop: `1px solid ${tokens.colorNeutralStroke3}`,
    marginTop: '-8px',
    paddingTop: '16px',
    animationName: 'fadeIn',
    animationDuration: '0.3s',
    animationFillMode: 'forwards',
  },

  chevron: {
    color: tokens.colorNeutralForeground3,
    transition: 'transform 0.3s cubic-bezier(0.33, 1, 0.68, 1)',
  },

  chevronExpanded: {
    transform: 'rotate(90deg)',
  },
});

const useTypingEffect = (text: string, typingSpeed = 50, start = true) => {
  const [typedText, setTypedText] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!start || typedText.length === text.length) {
      if (typedText.length === text.length) setIsDone(true);
      return;
    }

    const typingInterval = setInterval(() => {
      setTypedText((prev) => text.substring(0, prev.length + 1));
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [text, typedText, typingSpeed, start]);

  return { typedText, isDone };
};

export default function WelcomeScreen() {
  const styles = useStyles();
  const { userProfile } = useAuth();
  const { sendMessage } = useChat();
  const [visible, setVisible] = useState(false);
  const [tools, setTools] = useState<{ name: string; description: string }[]>(
    [],
  );
  const userName = userProfile?.name || 'User';

  useEffect(() => {
    // getTools()
    //   .then((data) => setTools(data))
    //   .catch((err) => console.error('Failed to fetch tools', err));
  }, []);

  const descriptionText =
    "I'm your AI-Powered Topcoder Assistant, I have direct access to the Topcoder platform. Leverage my tools to find challenges, analyze skills, and get data-driven insights. To get started, what aspect of Topcoder are you most interested in learning about?";

  const { typedText: typedDescription, isDone: isDescriptionDone } =
    useTypingEffect(descriptionText, 1);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const capabilities = [
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

  const handleAction = (prompt: string) => sendMessage(prompt);
  const handleKeyDown = (event: React.KeyboardEvent, prompt: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleAction(prompt);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.headerContent}>
        <div
          className={styles.welcomeBadge}
          style={visible ? { opacity: 1, transform: 'translateY(0)' } : {}}
        >
          <Sparkle24Filled className={styles.sparkleIcon} />
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Text className={styles.welcomeText}>Welcome back,</Text>
            <Text
              className={styles.welcomeText}
              style={{ whiteSpace: 'nowrap' }}
            >
              {userName}
            </Text>
          </div>
        </div>
        <Body1
          className={styles.headerDescription}
          style={visible ? { opacity: 1, transform: 'translateY(0)' } : {}}
        >
          {typedDescription}
          {!isDescriptionDone && <span className={styles.typingCursor} />}
        </Body1>
      </div>

      <div className={styles.capabilitiesGrid}>
        {capabilities.map((capability, index) => (
          <div
            key={index}
            className={styles.capabilityCard}
            style={
              visible
                ? {
                    opacity: 1,
                    transform: 'translateY(0)',
                    transitionDelay: `${500 + index * 100}ms`, // Staggered delay
                  }
                : {}
            }
            tabIndex={0}
            aria-label={`${capability.title}: ${capability.description}`}
          >
            <div className={styles.capabilityHeader}>
              <div className={styles.iconWrapper}>
                <div className={`${styles.capabilityIcon} capability-icon`}>
                  {capability.icon}
                </div>
              </div>
              <Text className={styles.capabilityTitle}>{capability.title}</Text>
            </div>

            <Text className={styles.capabilityDescription}>
              {capability.description}
            </Text>

            <div
              className={styles.exampleBlock}
              onClick={() => handleAction(capability.prompt)}
              onKeyDown={(e) => handleKeyDown(e, capability.prompt)}
              role="button"
            >
              <div className={styles.exampleContent}>
                <Text className={styles.exampleLabel}>Try asking</Text>
                <Text className={styles.exampleText}>{capability.prompt}</Text>
              </div>
              <ChevronRight20Regular
                className={`${styles.exampleArrow} example-arrow`}
              />
            </div>
          </div>
        ))}
      </div>

      {tools.length > 0 && (
        <div className={styles.headerContent} style={{ marginTop: '48px' }}>
          <Body1
            className={styles.headerDescription}
            style={visible ? { opacity: 1, transform: 'translateY(0)' } : {}}
          >
            <strong
              style={{
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Toolbox24Regular /> Available Tools
            </strong>
            <Accordion collapsible className={styles.toolListContainer}>
              {tools.map((tool) => (
                <AccordionItem key={tool.name} value={tool.name}>
                  <AccordionHeader>{tool.name}</AccordionHeader>
                  <AccordionPanel>
                    <MarkdownRenderer content={tool.description} />
                  </AccordionPanel>
                </AccordionItem>
              ))}
            </Accordion>
          </Body1>
        </div>
      )}
    </div>
  );
}