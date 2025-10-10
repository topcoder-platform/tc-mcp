import { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { streamChat, type StreamMessage } from "../services/api";
import { useAuth } from "../context/AuthContext";

export interface Message {
  id: string;
  author: "user" | "bot" | "system";
  content: string;
  toolResults?: [
    {
      toolName: string;
      data: any;
    }
  ];
}

export type AgentStatus = "idle" | "thinking" | "streaming_text" | "calling_tool" | "processing_tool_result" | "error";

export const useChatProvider = () => {
  const { ssoToken } = useAuth();
  const [historyVersion, setHistoryVersion] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [userPrompt, setUserPrompt] = useState<Message | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<Message | null>(null);
  const [restoredPrompt, setRestoredPrompt] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>("idle");

  const isNewChatRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentToolRef = useRef<string | null>(null);

  const refreshHistory = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  // Function to send a message
  const sendMessage = useCallback(
    async (prompt: string, retry?: boolean) => {
      if (!prompt.trim() || !ssoToken) return;

      setIsWorking(true);
      setError(null);
      setRestoredPrompt(null);

      if (retry) console.log("Retrying...");

      isNewChatRef.current = !sessionId || messages.length === 0;
      const userMessage: Message = { id: uuidv4(), author: "user", content: prompt };
      setUserPrompt(userMessage);

      const botMessagePlaceholder: Message = { id: uuidv4(), author: "bot", content: "" };
      setStreamingMessage(botMessagePlaceholder);

      // Create a new AbortController for this request
      abortControllerRef.current = new AbortController();

      // Define the callbacks for the streaming API
      const streamCallbacks = {
        onSessionStart: (newSessionId: string) => {
          console.log("session started:", newSessionId);
          setAgentStatus("thinking");
          if (sessionId !== newSessionId) setSessionId(newSessionId);
        },
        onMessage: (streamMsg: StreamMessage) => {
          switch (streamMsg.type) {
            case "chunk":
              setAgentStatus("streaming_text");
              setStreamingMessage((prev) => {
                if (prev && prev.id === botMessagePlaceholder.id) {
                  return { ...prev, content: prev.content + streamMsg.content };
                }
                return prev;
              });
              break;
            case "tool_start":
              setAgentStatus("calling_tool");
              currentToolRef.current = streamMsg.content;
              break;
            case "tool_result":
              // After the tool result is received, the agent is processing it.
              setAgentStatus("processing_tool_result");
              setStreamingMessage((prev) => {
                if (prev && prev.id === botMessagePlaceholder.id) {
                  return { ...prev, toolResults: streamMsg.content };
                }
                return prev;
              });
              break;
            case "output":
              // Replace the entire content with the final, clean version
              console.log("output\n", streamMsg.content);
              setStreamingMessage((prev) => {
                if (prev && prev.id === botMessagePlaceholder.id) {
                  return { ...prev, content: streamMsg.content };
                }
                return prev;
              });
              break;
            default:
              break;
          }
        },
        onError: (err: Error) => {
          setError(err.message);
          setIsWorking(false);
          setAgentStatus("error");
        },
        onEnd: () => {
          setIsWorking(false);
          setAgentStatus("idle");
          currentToolRef.current = null;
          abortControllerRef.current = null;
          if (error) return;

          // Move the completed streaming message into the messages history
          setStreamingMessage((currentStreamingMsg) => {
            if (currentStreamingMsg?.content) {
              setMessages((prev) => {
                if (prev.find((m) => m.id === currentStreamingMsg.id)) return prev;

                const finalHistory = [...prev, userMessage, currentStreamingMsg];
                return finalHistory;
              });
              if (isNewChatRef.current) {
                console.log("New chat detected, refreshing history panel...");
                refreshHistory();
                isNewChatRef.current = false; // Reset the flag
              }
              console.log("Chat stream ended.");

              setUserPrompt(null);
            }

            return null; // clear after pushing
          });
        },
      };

      // Call the API service
      await streamChat(prompt, ssoToken, sessionId, streamCallbacks, abortControllerRef.current.signal);
    },
    [ssoToken, sessionId, agentStatus]
  );

  // Function to stop the current stream
  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      const promptToRestore = userPrompt?.content;

      // Abort the network request
      abortControllerRef.current.abort();
      console.log("Chat stream stopped by user.");

      // clean up the UI state
      setIsWorking(false);
      setAgentStatus("idle");
      setUserPrompt(null);
      setStreamingMessage(null);
      currentToolRef.current = null;
      abortControllerRef.current = null;

      if (promptToRestore) {
        setRestoredPrompt(promptToRestore);
      }
    }
  }, [userPrompt, setRestoredPrompt]);

  const retry = useCallback(() => {
    if (userPrompt) {
      setStreamingMessage(null);
      sendMessage(userPrompt.content, true);
      return;
    }

    const lastUserMessage = [...messages].reverse().find((m) => m.author === "user");
    if (lastUserMessage) {
      setMessages((prev) => prev.slice(0, prev.lastIndexOf(lastUserMessage) + 1));
      setStreamingMessage(null);
      sendMessage(lastUserMessage.content);
    }
  }, [userPrompt, messages, sendMessage]);

  return {
    sessionId,
    setSessionId,
    messages,
    setMessages,
    userPrompt,
    setUserPrompt,
    streamingMessage,
    setStreamingMessage,
    isWorking,
    error,
    setError,
    agentStatus,
    sendMessage,
    stop,
    retry,
    restoredPrompt,
    setRestoredPrompt,
    currentTool: currentToolRef.current,
    historyVersion,
  };
};
