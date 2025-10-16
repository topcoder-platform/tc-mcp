import { useLayoutEffect, useRef } from "react";

// A simple counter to distinguish renders in the log
let renderCount = 0;

export function useSmoothScroll<T extends HTMLElement>(dependencies: any[]) {
  const scrollContainerRef = useRef<T>(null);
  const workingContainerRef = useRef<T>(null);
  const isUserScrollingRef = useRef(false);

  // This effect will run ONCE when the component mounts.
  // Its job is to attach the scroll event listener.
  useLayoutEffect(() => {
    try {
      const container = scrollContainerRef.current;
      const workingContainer = workingContainerRef.current;

      if (!container || !workingContainer) {
        console.log("[useSmoothScroll] No scroll container found.");
        return;
      }

      const handleScroll = () => {
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;
        const isAtBottom = scrollPosition >= scrollHeight;

        // Log the scroll position to see what's happening
        // console.log(`[useSmoothScroll] Scrolling... Position: ${scrollPosition}, Height: ${scrollHeight}, IsAtBottom: ${isAtBottom}`);

        // If the user's action causes them to no longer be at the bottom, we lock auto-scroll.
        if (!isAtBottom) {
          if (!isUserScrollingRef.current) {
            isUserScrollingRef.current = true;
          }
        } else {
          // If the user scrolls back to the bottom, we re-enable auto-scroll.
          if (isUserScrollingRef.current) {
            isUserScrollingRef.current = false;
          }
        }
      };

      container.addEventListener("scroll", handleScroll);
      workingContainer.addEventListener("scroll", handleScroll);
      console.log("[useSmoothScroll] Attached scroll event listener.");

      // Cleanup function to remove the listener when the component unmounts
      return () => {
        container.removeEventListener("scroll", handleScroll);
        workingContainer.removeEventListener("scroll", handleScroll);
      };
    } catch (error) {
      console.error("Error handling scroll event:", error);
    }
  }, []); // Empty dependency array means this runs only once on mount.

  // This effect runs EVERY time the content (dependencies) changes.
  // Its job is to perform the auto-scroll if conditions are met.
  useLayoutEffect(() => {
    renderCount++;
    const container = scrollContainerRef.current;

    if (!container) {
      return;
    }

    if (isUserScrollingRef.current) {
    } else {
      console.log("[useSmoothScroll] Auto-scrolling...");
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, dependencies);

  // 3. The hook returns the ref object so the calling component can attach it to a DOM element.
  return { scrollContainerRef, workingContainerRef };
}
