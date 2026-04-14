import { useEffect, useState } from 'react';

/**
 * Hook personalizado para manejar animaciones de entrada suave del header
 * Proporciona clases de animación escalonada para elementos dentro del header
 */
export function useHeaderAnimation() {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation when component mounts
    setIsAnimating(true);
  }, []);

  return {
    isAnimating,
    getHeaderClasses: () => 'animate-in fade-in slide-in-from-top-4 duration-500 ease-out',
    getLogoClasses: () => 'animate-in fade-in zoom-in-75 duration-700 ease-out',
    getNavClasses: () => 'animate-in fade-in slide-in-from-top-2 duration-700 delay-100 ease-out',
    getButtonsClasses: () => 'animate-in fade-in slide-in-from-right-2 duration-700 delay-200 ease-out',
    getSearchClasses: () => 'animate-in fade-in scale-95 duration-700 delay-150 ease-out',
  };
}
