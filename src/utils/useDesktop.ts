import { useState, useEffect } from 'react';

export const useDesktop = (breakpoint: number = 1024) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const isDesktopView = window.innerWidth >= breakpoint;
      setIsDesktop(isDesktopView);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  return isDesktop;
};

export default useDesktop; 