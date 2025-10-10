import React, { useRef, useEffect, useState } from "react";
import { Body1, Button, makeStyles, mergeClasses, Spinner } from "@fluentui/react-components";
import UserMessage from "./Messages/UserMessage";
import AgentMessage from "./Messages/AgentMessage";
import UserInput from "./UserInput";
import WelcomeScreen from "./WelcomeScreen";
import { useChat } from "../context/ChatContext";
import { useViewport } from "../hooks/useViewport";
import { ArrowClockwise20Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  container: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    overflowY: "auto",
    padding: "16px 20px",
    scrollBehavior: "smooth",
  },
  messageList: {
    maxWidth: "960px",
    width: "100%",
  },
  workingContainer: {
    maxWidth: "960px",
    width: "100%",
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
  overlay: {
    position: "absolute",
    inset: "0", // Shorthand for top: 0, left: 0, right: 0, bottom: 0
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 9, // Must be lower than the history panel's z-index (10)

    // For the fade effect
    opacity: 0,
    pointerEvents: "none",
    transition: "opacity 0.3s ease-in-out",
  },
  overlayVisible: {
    opacity: 1,
    pointerEvents: "auto", // Make it clickable when visible
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "16px",
    padding: "20px",
    textAlign: "center",
  },
  errorText: {
    color: "var(--colorPaletteRedForeground1)",
  },
});

const ChatWindow: React.FC = () => {
  const styles = useStyles();
  const {
    isLoading,
    loadError,
    messages,
    userPrompt,
    streamingMessage,
    isWorking,
    agentStatus,
    currentTool,
    isSheetOpen,
    isHistoryPanelOpen,
    toggleHistoryPanel,
    loadChat,
  } = useChat();
  const { width } = useViewport();
  const isMobile = width < 768;
  const messageListRef = useRef<HTMLDivElement>(null);
  const bottomOfChatRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const workingContainerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const doScroll = userPrompt || container.scrollHeight > container.clientHeight * 2;
    if (doScroll) bottomOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userPrompt]);

  useEffect(() => {
    setContainerHeight(scrollContainerRef?.current?.clientHeight || 0);
  }, [scrollContainerRef]);

  const showWelcomeScreen = !userPrompt && !isWorking && !isLoading && !loadError && messages.length === 0;

  return (
    <div className={styles.root}>
      <div ref={scrollContainerRef} className={styles.container} style={{ scrollbarWidth: isSheetOpen || showWelcomeScreen ? "none" : "thin" }}>
        {showWelcomeScreen ? (
          <WelcomeScreen />
        ) : isLoading ? (
          <div className={styles.loadingContainer}>
            <Spinner size="large" />
          </div>
        ) : loadError ? (
          <div className={styles.errorContainer}>
            <Body1 className={styles.errorText}>{loadError.message}</Body1>
            <Button
              icon={<ArrowClockwise20Regular />}
              appearance="secondary"
              onClick={() => loadChat(loadError.sessionId)} // <-- Wire up the retry
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div ref={messageListRef} className={styles.messageList}>
              {messages.map((msg, i) => {
                if (msg.author === "user" || msg.author === "system") {
                  return <UserMessage key={msg.id} message={msg} />;
                } else {
                  return (
                    <AgentMessage key={msg.id} isLastMsg={!userPrompt && i === messages.length - 1} message={msg} parentContainerHeight={containerHeight} />
                  );
                }
              })}
            </div>
            <div
              ref={workingContainerRef}
              className={styles.workingContainer}
              style={userPrompt ? { minHeight: (scrollContainerRef.current?.clientHeight || 200) - 100 } : {}}
            >
              {userPrompt && <UserMessage key={userPrompt.id} message={userPrompt} />}
              {/* Render the single, volatile streaming message. */}
              {streamingMessage && (
                <AgentMessage
                  key={streamingMessage.id}
                  message={streamingMessage}
                  isWorking={isWorking}
                  agentStatus={agentStatus}
                  currentTool={currentTool}
                  parentContainerHeight={containerHeight}
                />
              )}
            </div>
          </>
        )}
        {/* An invisible div at the end of the list to scroll to */}
        <div ref={bottomOfChatRef} />
        <div style={{ height: "100px" }}></div>
      </div>

      <div
        className={mergeClasses(styles.overlay, isMobile && isHistoryPanelOpen && styles.overlayVisible)}
        onClick={toggleHistoryPanel}
        aria-label="Close history panel"
      />
      <UserInput sessionError={isLoading || !!loadError} />
    </div>
  );
};

export default ChatWindow;
