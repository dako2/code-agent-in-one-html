import { useState, useEffect } from 'react';

function getWindowHeight() {
  // Ensure this code only runs on the client-side
  if (typeof window === 'undefined') {
    return 0;
  }
  return window.innerHeight;
}

export function useWindowHeight() {
  const [windowHeight, setWindowHeight] = useState(getWindowHeight());

  useEffect(() => {
    function handleResize() {
      setWindowHeight(getWindowHeight());
    }

    window.addEventListener('resize', handleResize);
    // Set initial height after mount
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowHeight;
}
