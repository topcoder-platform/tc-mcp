import React from "react";
import { FluentProvider, teamsDarkTheme, teamsHighContrastTheme, makeStyles, createLightTheme } from "@fluentui/react-components";
import { useTeamsTheme } from "./hooks/useTeams";
import { AuthProvider } from "./context/AuthContext";
import { ChatProvider } from "./context/ChatContext";
import TabApp from "./pages/TabApp";

const useStyles = makeStyles({
  root: {
    flex: "1 1 auto",
    minHeight: 0,
    overflowY: "auto",
    // paddingBottom: calc(var(--composer-height) + env(safe-area-inset-bottom)),
    // -webkit-overflow-scrolling: touch,
    width: "100vw",
    backgroundColor: "var(--colorNeutralBackground1)",
    fontFamily: "'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  loadingContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  spinner: {
    width: "32px",
    height: "32px",
  },
});

const App: React.FC = () => {
  const styles = useStyles();
  const { theme, isInitialized, brandRamp } = useTeamsTheme();
  const customTheme = createLightTheme(brandRamp);

  if (!isInitialized)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}>
          <svg viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="var(--colorNeutralStroke2)" strokeWidth="2" />
            <circle
              cx="16"
              cy="16"
              r="14"
              stroke="var(--colorBrandBackground)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="87.96"
              strokeDashoffset="65.97"
            >
              <animateTransform attributeName="transform" type="rotate" values="0 16 16;360 16 16" dur="1s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>
      </div>
    );

  return (
    <FluentProvider theme={theme === "dark" ? teamsDarkTheme : theme === "contrast" ? teamsHighContrastTheme : customTheme} className={styles.root}>
      <AuthProvider>
        <ChatProvider>
          <TabApp />
        </ChatProvider>
      </AuthProvider>
    </FluentProvider>
  );
};

export default App;
