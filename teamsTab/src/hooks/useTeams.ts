import { useState, useEffect } from 'react';
import { app } from '@microsoft/teams-js';
import { type BrandVariants } from "@fluentui/react-components";

const brandRamp: BrandVariants = {
  10: "#04131b", // darkest
  20: "#082836",
  30: "#0c3c52",
  40: "#11506e",
  50: "#146089",
  60: "#16679a",
  70: "#1d78ad",
  80: "#16679a", // primary brand
  90: "#2a8bbf",
  100: "#4b9fcb",
  110: "#72b5d8",
  120: "#9acbe4",
  130: "#bedff0",
  140: "#dceef7",
  150: "#eff6fa",
  160: "#f9f9f9", // lightest
};

export function useTeamsTheme() {
  const [theme, setTheme] = useState<"light" | "dark" | "contrast">("light");
  const [isInitialized, setIsInitialized] = useState(false);

  const isTeamsTab = import.meta.env.VITE_IS_NOT_TEAMS_TAB !== "true";
  if (!isTeamsTab) return { theme, isInitialized: true, brandRamp };

  useEffect(() => {
    try {
      app.initialize().then(() => {
        app.getContext().then((context) => {
          const themeString = context.app.theme || "default";
          switch (themeString.toLowerCase()) {
            case "dark":
              setTheme("dark");
              break;
            case "contrast":
              setTheme("contrast");
              break;
            default:
              setTheme("light");
              break;
          }
        });

        // Register a theme change handler
        app.registerOnThemeChangeHandler((themeName) => {
          switch (themeName.toLowerCase()) {
            case "dark":
              setTheme("dark");
              break;
            case "contrast":
              setTheme("contrast");
              break;
            default:
              setTheme("light");
              break;
          }
        });

        setIsInitialized(true);
      });
    } catch (error) {
      alert("This app is made for MS Teams only");
    } finally {
    }
  }, []);

  return { theme, isInitialized, brandRamp };
}