import React from "react";
import { Drawer, DrawerBody, Button, makeStyles, makeStaticStyles } from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import { useChat } from "../context/ChatContext";
import { useViewport } from "../hooks/useViewport";

const useGlobalStyles = makeStaticStyles({
  // This selector is highly specific:
  // It targets a div that is a direct child of the body,
  // has the data-portal-node attribute,
  "body > div[data-portal-node='true']": {
    backgroundColor: "transparent !important",
  },
});

const useStyles = makeStyles({
  root: {
    boxShadow: "var(--shadow8)",
    backgroundColor: "var(--colorNeutralBackground1)",
  },
  drawerHeader: {
    // 1. Establish the positioning context for the button
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: "12px",
    right: "12px",
    zIndex: 10,
    width: "32px",
    height: "32px",
    minWidth: "32px",
    borderRadius: "50%",
    backgroundColor: "var(--colorNeutralBackground1)",
    boxShadow: "var(--shadow4)",
    alignSelf: "flex-start",
  },
});

const SidePanel: React.FC = () => {
  const { isSheetOpen, closeSheet, sheetContent } = useChat();
  const { width } = useViewport();
  useGlobalStyles();
  const styles = useStyles();

  // Determine responsive behavior based on viewport width
  const isDesktop = width > 1440;
  const isMobile = width < 768;

  // 'inline' for desktop side-by-side view, 'modal' for overlay on smaller screens
  const drawerType = isDesktop ? "inline" : "overlay";

  // Dynamic width for the drawer
  const drawerWidth = isDesktop ? "40%" : isMobile ? "100vw" : "60vw";

  return (
    <Drawer
      type={drawerType}
      position="end"
      open={isSheetOpen}
      onOpenChange={(_, { open }) => (open ? null : closeSheet())}
      style={{ width: drawerWidth }}
      className={styles.root}
    >
      <Button className={styles.closeButton} aria-label="Close" icon={<Dismiss24Regular />} onClick={closeSheet} />

      <DrawerBody>{sheetContent}</DrawerBody>
    </Drawer>
  );
};

export default SidePanel;
