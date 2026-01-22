import React, { createContext, useContext, type ReactNode, useCallback, useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useChatProvider, type AgentStatus, type Message } from "../hooks/useChat";
import { getConversationDetails } from "../services/api";
import { useAuth } from "./AuthContext";
import { pages } from "@microsoft/teams-js";
import { config } from '../config';

interface LoadError {
  sessionId: string;
  message: string;
}

interface ChatContextType {
  isLoading: boolean;
  messages: Message[];
  userPrompt: Message | null;
  streamingMessage: Message | null;
  isWorking: boolean;
  error: string | null;
  sessionId: string | null;
  sendMessage: (prompt: string) => Promise<void>;
  stop: () => void;
  retry: () => void;
  restoredPrompt: string | null;
  setRestoredPrompt: (prompt: string | null) => void;

  startNewChat: () => void;
  loadChat: (sessionId: string) => Promise<void>;
  loadError: LoadError | null;
  agentStatus: AgentStatus;
  currentTool: string | null;

  isHistoryPanelOpen: boolean;
  historyVersion: number;
  toggleHistoryPanel: () => void;

  isSheetOpen: boolean;
  sheetContent: React.ReactNode | null;
  openSheet: (content: React.ReactNode) => void;
  closeSheet: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { ssoToken } = useAuth();
  const {
    messages,
    setMessages,
    userPrompt,
    setUserPrompt,
    streamingMessage,
    setStreamingMessage,
    sessionId,
    setSessionId,
    isWorking,
    error,
    setError,
    sendMessage,
    stop,
    retry,
    restoredPrompt,
    setRestoredPrompt,
    agentStatus,
    currentTool,
    historyVersion,
  } = useChatProvider();
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [sheetContent, setSheetContent] = useState<React.ReactNode | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const { isTeamsTab } = config;

  const dataFetchControllerRef = useRef<AbortController | null>(null);
  const activeFetchIdRef = useRef<string | null>(null);

  const openSheet = useCallback((content: React.ReactNode) => {
    setSheetContent(content);
    setIsSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetOpen(false);
    setTimeout(() => setSheetContent(null), 150);
  }, []);

  const toggleHistoryPanel = useCallback(() => {
    setIsHistoryPanelOpen((prev) => !prev);
  }, []);

  const startNewChat = useCallback(() => {
    if (dataFetchControllerRef.current) {
      dataFetchControllerRef.current.abort();
    }

    setMessages([]);
    setUserPrompt(null);
    setStreamingMessage(null);
    setIsHistoryPanelOpen(false);
    setIsSheetOpen(false);
    setSessionId(null);
    setError(null);
  }, [setMessages, setSessionId, setUserPrompt, setStreamingMessage, setIsHistoryPanelOpen, setIsSheetOpen]);

  const loadChat = useCallback(
    async (sessionIdToLoad: string) => {
      if (!ssoToken) return;

      if (dataFetchControllerRef.current) {
        dataFetchControllerRef.current.abort();
      }

      dataFetchControllerRef.current = new AbortController();
      const signal = dataFetchControllerRef.current.signal;
      const fetchId = uuidv4();
      activeFetchIdRef.current = fetchId;

      setIsHistoryPanelOpen(false);
      setSessionId(sessionIdToLoad);
      setIsLoading(true);
      try {
        const fullConversation = await getConversationDetails(ssoToken, sessionIdToLoad, signal);

        // Map the API response to the UI's Message format
        const uiMessages: Message[] = fullConversation.messages.map((msg) => ({
          id: uuidv4(), // Generate a unique ID for React keys
          author: msg.author,
          content: msg.content,
        }));

        // Before setting state, check if we are still the active fetch
        if (activeFetchIdRef.current === fetchId) {
          setMessages(uiMessages);
          setSessionId(sessionIdToLoad);
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          return;
        }
        // Only set error if we are still the active fetch
        if (activeFetchIdRef.current === fetchId) {
          console.error("Failed to load conversation:", error);
          setMessages([]); // Clear the view
          setLoadError({
            sessionId: sessionIdToLoad,
            message: "Sorry, this conversation could not be loaded.",
          });
        }
      } finally {
        if (activeFetchIdRef.current === fetchId) {
          setIsLoading(false);
        }
      }
    },
    [ssoToken, setMessages, setSessionId]
  );

  useEffect(() => {
    if (!isTeamsTab) return;

    const backButtonHandler = () => {
      if (isSheetOpen) {
        closeSheet();
        return true;
      }

      if (isHistoryPanelOpen) {
        setIsHistoryPanelOpen(false);
        return true;
      }

      if (sessionId) {
        startNewChat();
        return true;
      }

      // If neither panel is open, do nothing and let Teams handle it.
      return false; // Event not handled
    };

    pages.backStack.registerBackButtonHandler(backButtonHandler);

    return () => {};
  }, [isHistoryPanelOpen, isSheetOpen, setIsHistoryPanelOpen, setIsSheetOpen]);

  const value = {
    isLoading,
    messages,
    userPrompt,
    streamingMessage,
    isWorking,
    error,
    sessionId,
    sendMessage,
    stop,
    retry,
    restoredPrompt,
    setRestoredPrompt,

    agentStatus,
    currentTool,
    loadError,
    startNewChat,
    loadChat,

    historyVersion,
    isHistoryPanelOpen,
    toggleHistoryPanel,

    isSheetOpen,
    sheetContent,
    openSheet,
    closeSheet,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
