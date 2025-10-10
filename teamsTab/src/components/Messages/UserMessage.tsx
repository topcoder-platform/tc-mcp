import React from 'react';
import { makeStyles, Text, Body1 } from "@fluentui/react-components";
import { type Message } from '../../hooks/useChat';

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: "12px",
    padding: "16px 0",
    alignItems: "flex-end",
    width: "100%",
  },
  avatar: {
    flexShrink: 0,
    marginTop: "2px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    flex: 1,
    minWidth: 0,
    maxWidth: "85%",
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  authorName: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground1)",
    marginBottom: "2px",
  },
  messageBubble: {
    padding: "12px 16px",
    borderRadius: "8px",
    maxWidth: "100%",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    lineHeight: "1.4",
    fontSize: "14px",
  },
  userBubble: {
    backgroundColor: "var(--colorBrandStroke2)",
    color: "var(--colorNeutralForeground1)",
    border: "1px solid var(--colorBrandStroke2)",
  },
  systemText: {
    color: "var(--colorNeutralForeground3)",
    fontStyle: "italic",
    fontSize: "13px",
    padding: "8px 0",
  },
});

interface UserMessageProps {
  message: Message;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  const styles = useStyles();

  if (!message.content) return null;

  if (message.author === "system") {
    return (
      <div className={styles.root}>
        <Text className={styles.systemText}>{message.content}</Text>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={`${styles.content} ${styles.messageBubble} ${styles.userBubble}`}>
          <Body1>{message.content}</Body1>
        </div>
      </div>
    </div>
  );
};

export default UserMessage;