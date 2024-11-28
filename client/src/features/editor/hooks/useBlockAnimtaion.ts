import { useEffect, useState } from "react";

export const useBlockAnimation = (blockRef: React.RefObject<HTMLDivElement>) => {
  const [isAnimationStart, setIsAnimationStart] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsAnimationStart(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      },
    );

    if (blockRef.current) {
      observer.observe(blockRef.current);
    }

    return () => {
      if (blockRef.current) {
        observer.unobserve(blockRef.current);
      }
    };
  }, []);

  return { isAnimationStart };
};
