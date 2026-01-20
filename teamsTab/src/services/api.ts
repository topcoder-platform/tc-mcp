import { fetchEventSource } from "@microsoft/fetch-event-source";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export interface ConversationHistoryItem {
  sessionId: string;
  updatedAt: string;
  title: string;
}

export interface FullConversation {
  sessionId: string;
  messages: {
    author: "user" | "bot" | "system";
    content: string;
    timestamp: string;
  }[];
}

export interface Tool {
  name: string;
  description: string;
}

export interface StreamMessage {
  type: 'chunk' | 'output' | 'tool_start' | 'error' | 'info' | 'tool_result';
  content: any;
  toolName?: string;
  agentName?: string;
}

// Define the callbacks the UI can provide to handle stream events
export interface StreamCallbacks {
  onSessionStart: (sessionId: string) => void;
  onMessage: (message: StreamMessage) => void;
  onError: (error: Error) => void;
  onEnd: () => void;
}

/**
 * Abortable chat stream request.
 *
 * @param prompt The user's input.
 * @param ssoToken The Azure AD SSO token for authentication.
 * @param sessionId The optional existing session ID to continue a conversation.
 * @param callbacks An object of callback functions to handle stream events.
 * @param abortSignal An AbortSignal to allow for cancelling the request.
 */
export async function streamChat(
  prompt: string,
  ssoToken: string,
  sessionId: string | null,
  callbacks: StreamCallbacks,
  abortSignal: AbortSignal,
): Promise<void> {
  const internalAbortController = new AbortController();
  if (abortSignal.aborted) {
    return; // Don't even start if the signal is already aborted
  }
  const onAbort = () => internalAbortController.abort();
  abortSignal.addEventListener('abort', onAbort);

  let streamEndedGracefully = false;

  try {
    await fetchEventSource(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ssoToken}`,
      },
      body: JSON.stringify({ prompt, sessionId }),
      signal: internalAbortController.signal,
      openWhenHidden: true, // Keep connection alive in background tabs

      // This is the main callback that handles incoming messages
      onmessage(ev) {
        // The server sent the 'end' event, so we can stop gracefully
        if (ev.event === 'end') {
          streamEndedGracefully = true;
          internalAbortController.abort('Stream ended');
          callbacks.onEnd();
          return;
        }

        if (ev.event === 'error') {
          const data = JSON.parse(ev.data);
          callbacks.onError(new Error(data.content));
          return;
        }

        if (ev.event === 'session_start') {
          const data = JSON.parse(ev.data);
          callbacks.onSessionStart(data.sessionId);
          return;
        }

        if (ev.event === 'message') {
          const data = JSON.parse(ev.data);
          callbacks.onMessage(data as StreamMessage);
          return;
        }
      },

      onclose() {
        console.log('Connection closed.');
        // If the stream did not end gracefully (no 'end' event), and the user
        // did not manually abort, then it was an unexpected server-side closure.
        if (!streamEndedGracefully && !abortSignal.aborted) {
          callbacks.onError(
            new Error('Connection closed unexpectedly. Please try again.'),
          );
        }
        callbacks.onEnd();
        return;
      },

      onerror(err) {
        const friendlyMessage = getFriendlyErrorMessage(err);
        callbacks.onError(new Error(friendlyMessage));

        // This tells fetchEventSource that the error is fatal and it
        // MUST NOT attempt to automatically retry.
        return;
      },
    });
  } catch (err: any) {
    if (err.name !== 'AbortError') {
      console.error('fetchEventSource failed:', err);
    } else {
      console.log("Stream aborted by user signal or server 'end' event.");
    }
  } finally {
    abortSignal.removeEventListener('abort', onAbort);
  }
}

/**
 * Fetches the user's conversation history list.
 * @param ssoToken The Azure AD SSO token for authentication.
 * @param filter Optional date filter ('today' | 'thisWeek').
 * @param search Optional search term.
 * @returns A promise that resolves to an array of history items.
 */
export async function getHistory(
  ssoToken: string,
  filter?: string,
  search?: string,
): Promise<ConversationHistoryItem[]> {
  const params = new URLSearchParams();
  if (filter) params.append('filter', filter);
  if (search) params.append('search', search);

  const response = await fetch(`${API_BASE_URL}/history?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${ssoToken}` },
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(
      errorBody.message || `Request failed with status ${response.status}`,
    );
  }
  return response.json();
}

/**
 * Fetches the full message list for a single conversation.
 * @param ssoToken The Azure AD SSO token.
 * @param sessionId The ID of the conversation to fetch.
 * @param signal An AbortSignal to allow for cancelling the request.
 * @returns A promise that resolves to the full conversation object.
 */
export async function getConversationDetails(
  ssoToken: string,
  sessionId: string,
  signal: AbortSignal,
): Promise<FullConversation> {
  const response = await fetch(`${API_BASE_URL}/history/${sessionId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${ssoToken}` },
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(
      errorBody.message || `Request failed with status ${response.status}`,
    );
  }
  return response.json();
}

/**
 * Fetches the list of available tools.
 * @returns A promise that resolves to an array of Tool objects.
 */
export async function getTools(): Promise<Tool[]> {
  const response = await fetch(`${API_BASE_URL}/tools`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tools: ${response.statusText}`);
  }
  return response.json();
}

function getFriendlyErrorMessage(err: any): string {
  // Log the full technical error for developers
  console.error("Technical API Error:", err);

  // Check for common network-related errors
  if (err instanceof TypeError && err.message.toLowerCase().includes("failed to fetch")) {
    return "Could not connect to the server. Please check your network connection and try again.";
  }

  // Generic fallback message for all other errors
  return "An unexpected error occurred. Please try again later or contact support.";
}
