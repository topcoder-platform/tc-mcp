import React, { Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import { Title1, makeStyles, Text, Spinner, Button } from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";

const ChatWindow = React.lazy(() => import("../components/ChatWindow"));
const HistoryPanel = React.lazy(() => import("../components/HistoryPanel"));
const SidePanel = React.lazy(() => import("../components/SidePanel"));

const useStyles = makeStyles({
  root: {
    display: "flex",
    height: "100dvh",
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground2)",
    overflow: "hidden",
    position: "relative",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    borderLeft: "1px solid var(--colorNeutralStroke2)",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: "16px",
    padding: "32px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
    gap: "16px",
    color: "var(--colorPaletteRedForeground1)",
    textAlign: "center",
  },
});

const TabApp: React.FC = () => {
  const styles = useStyles();
  const { ssoToken, isAuthenticating, error, retryTeamsSsoToken } = useAuth();

  if (isAuthenticating) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner size="large" label="Authenticating..." />
      </div>
    );
  }

  // Show an error message if authentication fails
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <Title1>Authentication Failed</Title1>
        <Text>{error}</Text>
        <Button icon={<ArrowClockwise24Regular />} appearance="secondary" onClick={retryTeamsSsoToken}>
          Retry
        </Button>
      </div>
    );
  }

  // If authentication is successful, render the main app
  if (ssoToken) {
    return (
      <Suspense
        fallback={
          <div className={styles.loadingContainer}>
            <Spinner size="large" />
          </div>
        }
      >
        <div className={styles.root}>
          <HistoryPanel />
          <main className={styles.main}>
            <ChatWindow />
          </main>
          <SidePanel />
        </div>
      </Suspense>
    );
  }

  return (
    <div className={styles.loadingContainer}>
      <Text>Something went wrong</Text>
    </div>
  );
};

export default TabApp;
