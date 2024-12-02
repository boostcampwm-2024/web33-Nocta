import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { TextButton } from "../button/textButton";
import { modalContainerAnimation, overlayAnimation } from "./modal.animation";
import {
  buttonContainer,
  container,
  modalContainer,
  modalContent,
  overlayBox,
} from "./modal.style";

interface ModalProps {
  isOpen: boolean;
  children: React.ReactNode;
  primaryButtonLabel: string;
  primaryButtonOnClick: () => void;
  secondaryButtonLabel?: string;
  secondaryButtonOnClick?: () => void;
}

export const Modal = ({
  isOpen,
  children,
  primaryButtonLabel,
  primaryButtonOnClick,
  secondaryButtonLabel,
  secondaryButtonOnClick,
}: ModalProps) => {
  const portal = document.getElementById("modal") as HTMLElement;

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (isOpen && event.key === "Enter") {
        event.preventDefault();
        primaryButtonOnClick?.();
      }
    };

    // 모달이 열려있을 때만 이벤트 리스너 추가
    if (isOpen) {
      window.addEventListener("keydown", handleKeyPress);
    }

    // 클린업 함수
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [isOpen, primaryButtonOnClick]);

  if (!isOpen) return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          className={container}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              secondaryButtonOnClick?.();
            }
          }}
        >
          <motion.div
            initial={overlayAnimation.initial}
            animate={overlayAnimation.animate}
            exit={overlayAnimation.exit}
            className={overlayBox}
          />

          <motion.div
            initial={modalContainerAnimation.initial}
            animate={modalContainerAnimation.animate}
            exit={modalContainerAnimation.exit}
            className={modalContainer}
          >
            <div className={modalContent}>{children}</div>
            <div className={buttonContainer}>
              {secondaryButtonLabel && (
                <TextButton onClick={secondaryButtonOnClick} variant="secondary">
                  {secondaryButtonLabel}
                </TextButton>
              )}
              <TextButton onClick={primaryButtonOnClick}>{primaryButtonLabel}</TextButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    portal,
  );
};
