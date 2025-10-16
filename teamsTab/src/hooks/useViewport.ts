import { useState, useLayoutEffect } from 'react';

export const useViewport = () => {
  const [width, setWidth] = useState(window.innerWidth);

  useLayoutEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    // Initial call to set the width
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { width };
};