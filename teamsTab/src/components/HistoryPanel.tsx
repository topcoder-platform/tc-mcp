import React, { useState, useEffect, useCallback } from "react";
import { makeStyles, mergeClasses, Body1, Spinner, Button, Input, RadioGroup, Radio, shorthands } from "@fluentui/react-components";
import { useAuth } from "../context/AuthContext";
import { getHistory, type ConversationHistoryItem } from "../services/api";
import { PanelLeftAdd24Filled, Search20Regular, ChevronLeft20Filled, ChevronRight20Filled, ArrowClockwise24Regular } from "@fluentui/react-icons";
import { useDebounce } from "../hooks/useDebounce";
import { useChat } from "../context/ChatContext";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "240px",
    minWidth: "240px",
    backgroundColor: "var(--colorNeutralBackground1)",
    gap: "12px",
    transition: "transform 0.3s ease-in-out",
    zIndex: 10,
    paddingTop: "12px",

    "@media (max-width: 768px)": {
      position: "absolute",
      height: "100dvh",
      boxShadow: "var(--shadow16)",
      transform: "translateX(-100%)", // Hidden by default
    },
  },
  mobileOpen: {
    "@media (max-width: 768px)": {
      transform: "translateX(0)",
    },
  },
  panelToggleButton: {
    display: "none", // Hide on desktop
    "@media (max-width: 768px)": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",

      position: "absolute",
      top: "15%",
      right: "-30px",

      width: "30px",
      height: "84px",
      minWidth: "auto",
      ...shorthands.padding(0),

      // Make it look attached on the left and rounded on the right
      ...shorthands.border("1px", "solid", "var(--colorNeutralStroke2)"),
      borderLeftWidth: "0",
      ...shorthands.borderRadius("0", "12px", "12px", "0"),

      boxShadow: "2px 0px 8px -2px rgba(0,0,0,0.12)",
    },
  },
  mobileHeader: {
    display: "none",
    "@media (max-width: 768px)": {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "4px",
    },
  },
  desktopHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    gap: "12px",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "0 12px",
  },
  logo: {
    display: "flex",
    alignSelf: "center",
    padding: "12px 0",
  },
  title: {
    color: "var(--colorNeutralForeground1)",
    fontWeight: "600",
  },
  controls: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  newChatButton: {
    display: "flex",
    gap: "4px",
    justifyContent: "flex-start",
    padding: "8px 12px",
    height: "36px",
  },
  refreshButton: {
    minWidth: "32px",
    width: "32px",
    height: "32px",
  },
  list: {
    flex: 1,
    overflowY: "auto",
    gap: "12px",
    display: "flex",
    flexDirection: "column",
    scrollbarWidth: "thin",
  },
  searchInput: {
    "& input": {
      fontSize: "14px",
      padding: "6px 8px",
    },
  },
  groupHeader: {
    ...shorthands.padding("12px", "12px", "4px", "12px"),
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--colorNeutralForeground)",
    textTransform: "uppercase",
  },

  historyItem: {
    display: "flex",
    alignItems: "center",
    textAlign: "left",
    justifyContent: "flex-start",
    minHeight: "30px",
    padding: "4px 12px",
    borderRadius: "0",
    border: "none",
    backgroundColor: "transparent",
    "&:hover": {
      backgroundColor: "var(--colorNeutralBackground1Hover)",
    },
    "&:active": {
      backgroundColor: "var(--colorNeutralBackground1Pressed)",
    },
  },
  activeHistoryItem: {
    backgroundColor: "var(--colorNeutralBackground1Selected)",
    fontWeight: 600,
    pointerEvents: "none",
  },
  itemText: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
    flex: 1,
    gap: "8px",
  },
  titleText: {
    fontSize: "13px",
    fontWeight: "400",
    color: "var(--colorNeutralForeground3)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  loader: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "32px 16px",
  },
  errorText: {
    color: "var(--colorPaletteRedForeground1)",
    fontSize: "14px",
    textAlign: "center",
    padding: "16px",
  },
  emptyState: {
    textAlign: "center",
    padding: "32px 16px",
    color: "var(--colorNeutralForeground3)",
    fontSize: "14px",
  },
  filterSection: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  errorContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    padding: "32px 16px",
  },
});

interface GroupedHistory {
  today: ConversationHistoryItem[];
  thisWeek: ConversationHistoryItem[];
  thisMonth: ConversationHistoryItem[];
  older: ConversationHistoryItem[];
}

// Helper function to group conversations by date
const groupConversations = (conversations: ConversationHistoryItem[]): GroupedHistory => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const groups: GroupedHistory = {
    today: [],
    thisWeek: [],
    thisMonth: [],
    older: [],
  };

  conversations.forEach((conv) => {
    const convDate = new Date(conv.updatedAt);
    if (convDate >= today) {
      groups.today.push(conv);
    } else if (convDate >= startOfWeek) {
      groups.thisWeek.push(conv);
    } else if (convDate >= startOfMonth) {
      groups.thisMonth.push(conv);
    } else {
      groups.older.push(conv);
    }
  });

  return groups;
};

const HistoryPanel: React.FC = () => {
  const styles = useStyles();

  const { ssoToken } = useAuth();
  const { sessionId: activeSessionId, startNewChat, loadChat, isHistoryPanelOpen, historyVersion, toggleHistoryPanel } = useChat();

  // const [history, setHistory] = useState<ConversationHistoryItem[]>([]);
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory | null>(null);
  const [isFetching, setisFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const fetchHistory = useCallback(async () => {
    if (!ssoToken) return;
    setisFetching(true);
    setError(null);
    try {
      const filter = activeFilter === "all" ? undefined : activeFilter;
      const data = await getHistory(ssoToken, filter, debouncedSearchTerm);
      setGroupedHistory(groupConversations(data));
      // setHistory(data);
    } catch (err: any) {
      setError("Failed to load history.");
    } finally {
      setisFetching(false);
    }
  }, [ssoToken, activeFilter, debouncedSearchTerm, activeFilter]);

  useEffect(() => {
    fetchHistory();
  }, [ssoToken, historyVersion, debouncedSearchTerm, activeFilter]);

  const renderGroup = (title: string, items: ConversationHistoryItem[]) => {
    if (items.length === 0) return null;
    return (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className={styles.groupHeader}>{title}</div>
        {items.map((item) => (
          <Button
            key={item.sessionId}
            title={new Date(item.updatedAt).toLocaleString()}
            className={mergeClasses(styles.historyItem, activeSessionId === item.sessionId && styles.activeHistoryItem)}
            onClick={() => loadChat(item.sessionId)}
          >
            <div className={styles.itemText}>
              <Body1 className={styles.titleText}>{item.title}</Body1>
            </div>
          </Button>
        ))}
      </div>
    );
  };

  return (
    <aside className={mergeClasses(styles.root, isHistoryPanelOpen && styles.mobileOpen)}>
      <div className={styles.header}>
        {/* <div className={styles.desktopHeader}>
          <Image src="/tc.logo.min.svg" alt="TC - AI" className={styles.logo} />
          <Title3 className={styles.title}>TC - MCP</Title3>
        </div> */}

        <div className={styles.controls}>
          <Button icon={<PanelLeftAdd24Filled />} appearance="primary" className={styles.newChatButton} onClick={startNewChat}>
            New chat
          </Button>

          <Input
            contentAfter={<Search20Regular />}
            placeholder="Search history..."
            size="small"
            className={styles.searchInput}
            value={searchTerm}
            onChange={(_, data) => setSearchTerm(data.value)}
            onFocus={() => setIsSearchFocused(true)}
          />

          {(isSearchFocused || searchTerm.length > 0) && (
            <div className={styles.filterSection}>
              <RadioGroup value={activeFilter} onChange={(_, data) => setActiveFilter(data.value)}>
                <Radio value="all" label="All conversations" />
                <Radio value="today" label="Today" />
                <Radio value="thisWeek" label="This week" />
              </RadioGroup>
            </div>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {isFetching ? (
          <div className={styles.loader}>
            <Spinner size="medium" />
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <Body1 className={styles.errorText}>{error}</Body1>
            <Button
              icon={<ArrowClockwise24Regular />}
              appearance="secondary"
              onClick={fetchHistory} // <-- Calls the existing fetch function
            >
              Retry
            </Button>
          </div>
        ) : !groupedHistory ||
          (groupedHistory.today.length === 0 &&
            groupedHistory.thisWeek.length === 0 &&
            groupedHistory.thisMonth.length === 0 &&
            groupedHistory.older.length === 0) ? (
          <div className={styles.emptyState}>
            <Body1>No conversations found</Body1>
          </div>
        ) : (
          <>
            {renderGroup("Today", groupedHistory.today)}
            {renderGroup("This Week", groupedHistory.thisWeek)}
            {renderGroup("This Month", groupedHistory.thisMonth)}
            {renderGroup("Older", groupedHistory.older)}
          </>
        )}
      </div>

      <Button
        className={styles.panelToggleButton}
        appearance={isHistoryPanelOpen ? "subtle" : "primary"}
        style={isHistoryPanelOpen ? { backgroundColor: "var(--colorNeutralBackground1)" } : {}}
        icon={isHistoryPanelOpen ? <ChevronLeft20Filled /> : <ChevronRight20Filled />}
        onClick={toggleHistoryPanel}
        aria-label={isHistoryPanelOpen ? "Close history" : "Open history"}
      />
    </aside>
  );
};

export default HistoryPanel;
