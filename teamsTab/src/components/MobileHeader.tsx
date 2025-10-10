import React from "react";
import { Button, makeStyles, Image } from "@fluentui/react-components";
import { useChat } from "../context/ChatContext";
import { PanelLeft24Filled } from "@fluentui/react-icons";

const useStyles = makeStyles({
  mobileHeader: {
    display: "none",
    "@media (max-width: 768px)": {
      display: "flex",
      gap: "4px",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 12px",
      borderBottom: "1px solid var(--colorNeutralStroke2)",
      backgroundColor: "var(--colorNeutralBackground1)",
    },
  },
  logo: {
    height: "14px",
    transition: "transform 0.3s ease-in-out",
  },
});

const MobileHeader: React.FC = () => {
  const styles = useStyles();
  const { toggleHistoryPanel, isHistoryPanelOpen } = useChat();
  return (
    <div className={styles.mobileHeader}>
      <Button
        icon={<PanelLeft24Filled color="var(--colorBrandBackground)" />}
        appearance="subtle"
        onClick={toggleHistoryPanel}
        aria-label="Toggle chat history"
      />
      <Image
        src="/tc.logo.min.svg"
        alt="TC - AI"
        className={styles.logo}
        style={{ transform: isHistoryPanelOpen ? "translateX(-768px)" : "translateX(0px)" }}
      />
    </div>
  );
};

export default MobileHeader;
