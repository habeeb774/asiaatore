import { useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for animation utilities
 * 
 * @returns {Object} - Animation functions and state
 */
export const useAnimation = () => {
  const animationFrameRef = useRef(null);
  const isAnimatingRef = useRef(false);
  
  const animate = useCallback((callback, duration) => {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      const frame = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        callback(progress, elapsed);
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(frame);
        } else {
          isAnimatingRef.current = false;
          resolve();
        }
      };
      
      isAnimatingRef.current = true;
      animationFrameRef.current = requestAnimationFrame(frame);
    });
  }, []);
  
  const fadeIn = useCallback((element, duration = 300) => {
    if (!element) return;
    
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return animate((progress) => {
      element.style.opacity = progress;
    }, duration);
  }, [animate]);
  
  const fadeOut = useCallback((element, duration = 300) => {
    if (!element) return;
    
    return animate((progress) => {
      element.style.opacity = 1 - progress;
    }, duration).then(() => {
      element.style.display = 'none';
    });
  }, [animate]);
  
  const slideIn = useCallback((element, direction = 'left', duration = 300) => {
    if (!element) return;
    
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    element.style.transform = transforms[direction];
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return animate((progress) => {
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      element.style.transform = `translate(0, 0)`;
      element.style.opacity = easeProgress;
    }, duration);
  }, [animate]);
  
  const slideOut = useCallback((element, direction = 'left', duration = 300) => {
    if (!element) return;
    
    const transforms = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    };
    
    return animate((progress) => {
      const easeProgress = Math.pow(progress, 3); // Ease in cubic
      element.style.transform = transforms[direction];
      element.style.opacity = 1 - easeProgress;
    }, duration).then(() => {
      element.style.display = 'none';
      element.style.transform = 'translate(0, 0)';
    });
  }, [animate]);
  
  const scaleIn = useCallback((element, duration = 300) => {
    if (!element) return;
    
    element.style.transform = 'scale(0)';
    element.style.opacity = '0';
    element.style.display = 'block';
    
    return animate((progress) => {
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      element.style.transform = `scale(${easeProgress})`;
      element.style.opacity = easeProgress;
    }, duration);
  }, [animate]);
  
  const scaleOut = useCallback((element, duration = 300) => {
    if (!element) return;
    
    return animate((progress) => {
      const easeProgress = Math.pow(progress, 3);
      element.style.transform = `scale(${1 - easeProgress})`;
      element.style.opacity = 1 - easeProgress;
    }, duration).then(() => {
      element.style.display = 'none';
      element.style.transform = 'scale(1)';
    });
  }, [animate]);
  
  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      isAnimatingRef.current = false;
    }
  }, []);
  
  const isAnimating = useCallback(() => {
    return isAnimatingRef.current;
  }, []);
  
  useEffect(() => {
    return () => {
      stopAnimation();
    };
  }, [stopAnimation]);
  
  return {
    animate,
    fadeIn,
    fadeOut,
    slideIn,
    slideOut,
    scaleIn,
    scaleOut,
    stopAnimation,
    isAnimating
  };
};

export default useAnimation;
