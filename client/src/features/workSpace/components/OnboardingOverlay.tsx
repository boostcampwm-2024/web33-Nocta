import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import CloseIcon from "@assets/icons/close.svg?react";
import {
  overlayContainer,
  highlightBox,
  tooltipBox,
  tooltipTitle,
  tooltipDescription,
  stepIndicator,
  nextButton,
  closeButton,
  IndicatorContainer,
} from "./OnboardingOverlay.style";

type Position = "right" | "left" | "top" | "bottom";
type Step = {
  target: string;
  title: string;
  description: string;
  position: Position;
};

interface OnboardingOverlayProps {
  isShow: boolean;
}

export const OnboardingOverlay = ({ isShow }: OnboardingOverlayProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps: Step[] = [
    {
      target: '[data-onboarding="menu-button"]',
      title: "메인 워크스페이스",
      description: "여러 페이지를 동시에 열고 자유롭게 작업할 수 있어요.",
      position: "right",
    },
    {
      target: '[data-onboarding="sidebar"]',
      title: "사이드바",
      description: "현재 워크스페이스에서 새로운 페이지를 만들고 관리할 수 있어요.",
      position: "right",
    },
    {
      target: '[data-onboarding="page-add-button"]',
      title: "페이지 추가 버튼",
      description: "새로운 페이지를 추가할 수 있어요.",
      position: "top",
    },
    {
      target: '[data-onboarding="login-button"]',
      title: "로그인 버튼",
      description: "로그인 하여 나만의 워크스페이스를 관리할 수 있어요.",
      position: "top",
    },
    {
      target: '[data-onboarding="bottom-nav"]',
      title: "하단 네비게이터",
      description: "열려있는 페이지들을 쉽게 전환할 수 있어요.",
      position: "top",
    },
  ];
  useEffect(() => {
    const hasCompletedOnboarding = sessionStorage.getItem("hasCompletedOnboarding");

    if (isShow && hasCompletedOnboarding === null) {
      // 요소들이 렌더링될 시간을 주기 위해 약간의 딜레이 추가
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isShow]);

  const handleClose = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsVisible(false);
      sessionStorage.setItem("hasCompletedOnboarding", "true");
    }
  };
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };
  const handleOverlayClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("hasCompletedOnboarding", "true");
  };
  const getTargetPosition = (selector: string) => {
    const element = document.querySelector(selector);
    if (!element) {
      return null;
    }

    const rect = element.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
  };
  const getTooltipPosition = (step: Step) => {
    const targetRect = document.querySelector(step.target)?.getBoundingClientRect();
    if (!targetRect) return null;

    const positions: Record<Position, { top: number; left: number }> = {
      right: {
        left: targetRect.right + 16,
        top: targetRect.top + targetRect.height / 2 - 60,
      },
      left: {
        left: targetRect.left - 280,
        top: targetRect.top + targetRect.height / 2 - 60,
      },
      top: {
        left: targetRect.left + targetRect.width / 2 + 40,
        top: targetRect.top - 150,
      },
      bottom: {
        left: targetRect.left + targetRect.width / 2 - 140,
        top: targetRect.bottom + 16,
      },
    };

    return positions[step.position];
  };

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const targetPosition = getTargetPosition(currentStepData.target);
  const tooltipPosition = getTooltipPosition(currentStepData);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={overlayContainer}
    >
      {targetPosition && (
        <motion.div
          className={highlightBox}
          style={{
            left: targetPosition.left,
            top: targetPosition.top,
            width: targetPosition.width,
            height: targetPosition.height,
            transition: "all 0.3s ease",
          }}
        />
      )}

      {tooltipPosition && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={tooltipBox}
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
          }}
        >
          <button onClick={handleOverlayClose} className={closeButton}>
            <CloseIcon />
          </button>
          <div className={IndicatorContainer}>
            {steps.map((_, index) => (
              <div key={index} className={stepIndicator({ active: index === currentStep })} />
            ))}
          </div>
          <h3 className={tooltipTitle}>{currentStepData.title}</h3>
          <p className={tooltipDescription}>{currentStepData.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {currentStep > 0 && (
                <button onClick={handlePrevious} className={nextButton({ variant: "secondary" })}>
                  이전
                </button>
              )}
              <button onClick={handleClose} className={nextButton({ variant: "primary" })}>
                {currentStep === steps.length - 1 ? "시작하기" : "다음"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
