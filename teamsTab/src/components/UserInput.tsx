import React, { useState, useRef, useEffect } from "react";
import { makeStyles, Textarea, Button, Body1, shorthands, Spinner, Text } from "@fluentui/react-components";
import { ArrowCurveUpLeft20Regular, ArrowClockwise20Regular, Stop16Filled, Send16Filled } from "@fluentui/react-icons";
import { useChat } from "../context/ChatContext";
import { useViewport } from "../hooks/useViewport";

const useStyles = makeStyles({
  root: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  inputArea: {
    display: "flex",
    alignItems: "flex-end",
    gap: "12px",
    padding: "12px",
    paddingLeft: "20px",
    paddingTop: "20px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 -2px 10px -4px rgba(0, 0, 0, 0.1)",
    transition: "border-color 0.2s ease-in-out",
    ...shorthands.borderTop("1px", "solid", "var(--colorNeutralStroke2)"),
    "@media (max-width: 540px)": {
      paddingLeft: "12px",
    },
  },
  textarea: {
    flex: 1,
    minHeight: "40px",
    maxHeight: "150px",
    resize: "none",
  },
  mobileSendButton: {
    height: "32px",
    borderRadius: "50%",
  },
  stopButtContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  loaderContainer: {
    position: "relative", // This is the key for overlaying the button
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
  },
  loadingSpinner: {
    // Make the spinner fill the container
    "& .fui-Spinner__svg": {
      width: "32px",
      height: "32px",
    },
  },
  stopButton: {
    // Overlay the button on top of the spinner
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    minWidth: "24px",
    width: "24px",
    height: "24px",
    ...shorthands.borderRadius("50%"),
  },
  errorContainer: {
    position: "absolute",
    top: "-100%",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "0 -2px 10px -4px rgba(0, 0, 0, 0.1)",
    padding: "16px",
  },
  errorText: {
    color: "var(--colorPaletteRedForeground1)",
    textAlign: "center",
  },
});

export default function UserInput({ sessionError = false }) {
  const styles = useStyles();
  const [prompt, setPrompt] = useState("");
  const { width } = useViewport();
  const { isWorking, error, sessionId, sendMessage, stop, retry, restoredPrompt, setRestoredPrompt } = useChat();
  const textareaRef = useRef<HTMLTextAreaElement>(null); // Ref for the textarea

  useEffect(() => {
    if (sessionId) return;
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    if (restoredPrompt) {
      setPrompt(restoredPrompt);
      textareaRef.current?.focus();
      setRestoredPrompt(null);
    }
  }, [restoredPrompt, setRestoredPrompt]);

  const handleSend = () => {
    const hasText = prompt.trim().length > 0;
    const canSubmit = !isWorking && hasText;
    if (canSubmit) {
      sendMessage(prompt);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isMobile = width < 540;

  return (
    <div className={styles.root}>
      {error && !isWorking && (
        <div className={styles.errorContainer}>
          <Body1 className={styles.errorText}>{error}</Body1>
          <Button icon={<ArrowClockwise20Regular />} appearance="secondary" onClick={retry}>
            Retry
          </Button>
        </div>
      )}

      <div className={styles.inputArea}>
        <Textarea
          ref={textareaRef} // Attach the ref
          className={styles.textarea}
          value={prompt}
          onChange={(_, data) => setPrompt(data.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isWorking || sessionError}
          resize="none"
          size="medium"
          appearance="filled-darker-shadow"
        />
        {isWorking ? (
          isMobile ? (
            <div className={styles.loaderContainer}>
              <Spinner className={styles.loadingSpinner} />
              <Button icon={<Stop16Filled />} onClick={stop} className={styles.stopButton} aria-label="Stop generation" appearance="subtle" />
            </div>
          ) : (
            <Button appearance="transparent" onClick={stop} className={styles.stopButtContainer}>
              <div className={styles.loaderContainer}>
                <Spinner className={styles.loadingSpinner} />
                <div className={styles.stopButton} aria-label="Stop generation" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <Stop16Filled />
                </div>
              </div>
              <Text weight="semibold">Stop</Text>
            </Button>
          )
        ) : isMobile ? (
          <Button
            appearance="primary"
            onClick={handleSend}
            aria-label="Ask"
            icon={<Send16Filled style={{ marginTop: "1px", marginLeft: "2px" }} />}
            className={styles.mobileSendButton}
            style={{ cursor: isWorking || sessionError ? "not-allowed" : "pointer" }}
          />
        ) : (
          <Button
            appearance="primary"
            onClick={handleSend}
            aria-label="Ask"
            style={{ display: "flex", gap: "8px", borderRadius: "24px", paddingTop: "4px", cursor: isWorking || sessionError ? "not-allowed" : "pointer" }}
          >
            <Text>Ask</Text>
            <ArrowCurveUpLeft20Regular style={{ transform: "rotate(270deg)", marginTop: "2px" }} />
          </Button>
        )}
      </div>
    </div>
  );
}
