import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { makeStyles, shorthands } from '@fluentui/react-components';

// 1. Define the styles using Fluent UI's makeStyles hook
// This hook provides access to the theme's design tokens for colors, fonts, spacing, etc.
const useMarkdownStyles = makeStyles({
  root: {
    color: 'var(--colorNeutralForeground1)',
    fontSize: 'var(--fontSizeBase300)',
    lineHeight: 'var(--lineHeightBase300)',
    ...shorthands.overflow('auto'), // Handle wide content
  },

  h1: {
    fontSize: 'var(--fontSizeHero700)',
    fontWeight: 'var(--fontWeightBold)',
    marginBottom: 'var(--spacingVerticalL)',
    // A gradient using Fluent UI's brand colors
    backgroundImage: 'linear-gradient(90deg, var(--colorBrandForeground1), var(--colorBrandForeground2))',
    backgroundClip: 'text',
    color: 'transparent',
  },

  h2: {
    fontSize: 'var(--fontSizeHero600)',
    fontWeight: 'var(--fontWeightSemibold)',
    marginBottom: 'var(--spacingVerticalM)',
    paddingBottom: 'var(--spacingVerticalSNudge)',
    ...shorthands.borderBottom('1px', 'solid', 'var(--colorNeutralStroke2)'),
  },

  h3: {
    fontSize: 'var(--fontSizeBase500)',
    fontWeight: 'var(--fontWeightMedium)',
    marginBottom: 'var(--spacingVerticalS)',
  },

  p: {
    marginBottom: 'var(--spacingVerticalM)',
    '&:last-child': {
      marginBottom: '0',
    },
  },

  ul: {
    listStyleType: 'disc',
    paddingLeft: 'var(--spacingHorizontalXXL)',
    marginBottom: 'var(--spacingVerticalM)',
  },

  ol: {
    listStyleType: 'decimal',
    paddingLeft: 'var(--spacingHorizontalXXL)',
    marginBottom: 'var(--spacingVerticalM)',
  },

  li: {
    marginBottom: 'var(--spacingVerticalSNudge)',
  },

  inlineCode: {
    backgroundColor: 'var(--colorNeutralBackground3)',
    ...shorthands.padding('var(--spacingVerticalXXS)', 'var(--spacingHorizontalSNudge)'),
    ...shorthands.borderRadius('var(--borderRadiusSmall)'),
    fontSize: 'var(--fontSizeBase200)',
    fontFamily: 'var(--fontFamilyMonospace)',
  },

  codeBlock: {
    display: 'block',
    backgroundColor: 'var(--colorNeutralBackground2)',
    ...shorthands.padding('var(--spacingHorizontalM)'),
    ...shorthands.borderRadius('var(--borderRadiusMedium)'),
    ...shorthands.border('1px', 'solid', 'var(--colorNeutralStroke2)'),
    fontSize: 'var(--fontSizeBase200)',
    fontFamily: 'var(--fontFamilyMonospace)',
    overflowX: 'auto',
    marginBottom: 'var(--spacingVerticalM)',
  },

  blockquote: {
    ...shorthands.borderLeft('4px', 'solid', 'var(--colorBrandStroke1)'),
    paddingLeft: 'var(--spacingHorizontalL)',
    fontStyle: 'italic',
    color: 'var(--colorNeutralForeground2)',
    marginBottom: 'var(--spacingVerticalM)',
  },

  strong: {
    fontWeight: 'var(--fontWeightSemibold)',
  },

  em: {
    fontStyle: 'italic',
  },

  a: {
    color: 'var(--colorBrandForegroundLink)',
    textDecorationLine: 'none',
    '&:hover': {
      textDecorationLine: 'underline',
    },
  },
});

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // 2. Instantiate the styles inside the component
  const styles = useMarkdownStyles();

  return (
    // 3. Apply the root style to a container div
    <div className={styles.root}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        // 4. Map each HTML element to a component that uses the corresponding style class
        components={{
          h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
          h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
          h3: ({ children }) => <h3 className={styles.h3}>{children}</h3>,
          p: ({ children }) => <p className={styles.p}>{children}</p>,
          ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
          ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
          li: ({ children }) => <li className={styles.li}>{children}</li>,
          code: ({ children }) => <code className={styles.codeBlock}>{children}</code>,
          blockquote: ({ children }) => <blockquote className={styles.blockquote}>{children}</blockquote>,
          strong: ({ children }) => <strong className={styles.strong}>{children}</strong>,
          em: ({ children }) => <em className={styles.em}>{children}</em>,
          a: ({ children, href }) => (
            <a href={href} className={styles.a} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};