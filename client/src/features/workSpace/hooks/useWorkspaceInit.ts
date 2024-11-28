import { useState, useEffect } from "react";
import { useSocketStore } from "@src/stores/useSocketStore";

interface UseWorkspaceInitReturn {
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
}

export const useWorkspaceInit = (): UseWorkspaceInitReturn => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { socket } = useSocketStore();

  const isFirstVisit = !sessionStorage.getItem("hasVisitedBefore");

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // 첫 방문이 아니면 IntroScreen 시간을 0으로 설정
        const IntroWaitTime = isFirstVisit ? 4700 : 0;

        await new Promise((resolve) => setTimeout(resolve, IntroWaitTime));

        // 첫 방문 표시 저장 (sessionStorage 사용)
        if (isFirstVisit) {
          sessionStorage.setItem("hasVisitedBefore", "true");
        }
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to initialize workspace"));
      } finally {
        // 페이드 아웃 효과를 위한 약간의 딜레이
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
      }
    };

    initializeWorkspace();
  }, [socket, isFirstVisit]);

  return { isLoading: isLoading && isFirstVisit, isInitialized, error };
};
