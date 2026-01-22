import { useState, useLayoutEffect } from 'react';

export type ViewMode = 'small' | 'medium' | 'large';

export const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useLayoutEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    // Initial call to set the width
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Medium is 640 <= width < 1024 (e.g. tablet landscape or small laptop)
  const isMedium = width >= 640 && width < 1024;
  const isLarge = width >= 1024;

  const viewMode: ViewMode = isLarge ? 'large' : isMedium ? 'medium' : 'small';

  return { width, viewMode };
};