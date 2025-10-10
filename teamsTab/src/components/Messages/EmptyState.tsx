import React from 'react';
import { makeStyles, Body1 } from "@fluentui/react-components";

const useStyles = makeStyles({
  root: {
    display: "flex",
    gap: "8px",
  },
  icon: {
    // fontSize: "48px",
    color: "var(--colorNeutralForeground3)", // Use a subtle color for the icon
    lineHeight: 0,
  },
  message: {
    color: "var(--colorNeutralForeground2)", // A slightly stronger but still muted color for text
    maxWidth: "400px",
  },
});

interface EmptyStateProps {
  message: string;
  icon: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, icon }) => {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.icon}>{icon}</div>
      <Body1 className={styles.message}>{message}</Body1>
    </div>
  );
};

export default EmptyState;