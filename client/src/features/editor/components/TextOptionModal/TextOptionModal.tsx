import { TextColorType, BackgroundColorType } from "@noctaCrdt/Interfaces";
import { Char } from "@noctaCrdt/Node";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BackgroundColorOptionModal } from "../ColorOptionModal/BackgroundColorOptionModal";
import { TextColorOptionModal } from "../ColorOptionModal/TextColorOptionModal";
import {
  modalContainer,
  optionButton,
  optionModal,
  optionButtonText,
} from "./TextOptionModal.style";

interface SelectionModalProps {
  selectedNodes: Array<Char> | null;
  isOpen: boolean;
  onBoldSelect: () => void;
  onItalicSelect: () => void;
  onUnderlineSelect: () => void;
  onStrikeSelect: () => void;
  onClose: () => void;
  onTextColorSelect: (color: TextColorType) => void;
  onTextBackgroundColorSelect: (color: BackgroundColorType) => void;
}

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};

export const TextOptionModal = ({
  selectedNodes,
  isOpen,
  onBoldSelect,
  onItalicSelect,
  onUnderlineSelect,
  onStrikeSelect,
  onClose,
  onTextColorSelect,
  onTextBackgroundColorSelect,
}: SelectionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [TextModalPosition, setTextModalPosition] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const [hoveredType, setHoveredType] = useState<"text" | "background" | null>(null);
  const [styleState, setStyleState] = useState({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrike: false,
  });

  const handleMouseEnter = (type: "text" | "background") => {
    setHoveredType(type);
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHoveredType(null);
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateModalPosition = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        onClose();
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setTextModalPosition({
        top: rect.top - 40,
        left: rect.left + rect.width / 2,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    updateModalPosition();
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      setStyleState({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrike: false,
      });
      setHoveredType(null);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!selectedNodes || selectedNodes.length === 0) {
      setStyleState({
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrike: false,
      });
      return;
    }

    // 각 스타일의 출현 횟수를 계산
    const styleCounts = {
      bold: 0,
      italic: 0,
      underline: 0,
      strike: 0,
    };

    // 각 노드의 스타일을 확인하고 카운트
    selectedNodes.forEach((node) => {
      // node.style이 undefined인 경우 빈 배열로 처리
      const nodeStyles = Array.isArray(node.style) ? node.style : node.style ? [node.style] : [];

      if (nodeStyles.includes("bold")) styleCounts.bold += 1;
      if (nodeStyles.includes("italic")) styleCounts.italic += 1;
      if (nodeStyles.includes("underline")) styleCounts.underline += 1;
      if (nodeStyles.includes("strike")) styleCounts.strike += 1;
    });

    const totalNodes = selectedNodes.length;

    // 모든 노드가 해당 스타일을 가지고 있는 경우에만 true
    setStyleState({
      isBold: styleCounts.bold === totalNodes,
      isItalic: styleCounts.italic === totalNodes,
      isUnderline: styleCounts.underline === totalNodes,
      isStrike: styleCounts.strike === totalNodes,
    });
  }, [selectedNodes]);

  const handleTextColorClick = (color: TextColorType) => {
    if (!selectedNodes || selectedNodes.length === 0) return;
    onTextColorSelect(color);
  };

  const handleTextBackgroundSelect = (color: BackgroundColorType) => {
    if (!selectedNodes || selectedNodes.length === 0) return;
    onTextBackgroundColorSelect(color);
  };

  if (!isOpen) return;

  return (
    <ModalPortal>
      <motion.div
        ref={modalRef}
        className={optionModal}
        style={{
          left: `${TextModalPosition.left}px`,
          top: `${TextModalPosition.top - 8}px`,
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
      >
        <div className={modalContainer} onClick={handleModalClick} onMouseDown={handleModalClick}>
          <button
            className={optionButton}
            onClick={onBoldSelect}
            style={{
              backgroundColor: styleState.isBold ? "#e2e8f0" : "transparent",
            }}
          >
            <span
              style={{
                fontWeight: "bold",
                opacity: styleState.isBold ? 1 : 0.6,
              }}
            >
              B
            </span>
          </button>
          <button
            className={optionButton}
            onClick={onItalicSelect}
            style={{
              backgroundColor: styleState.isItalic ? "#e2e8f0" : "transparent",
            }}
          >
            <span
              style={{
                fontStyle: "italic",
                fontWeight: "bold",
                opacity: styleState.isItalic ? 1 : 0.6,
              }}
            >
              I
            </span>
          </button>
          <button
            className={optionButton}
            onClick={onUnderlineSelect}
            style={{
              backgroundColor: styleState.isUnderline ? "#e2e8f0" : "transparent",
            }}
          >
            <span
              style={{
                textDecoration: "underline",
                fontWeight: "bold",
                opacity: styleState.isUnderline ? 1 : 0.6,
              }}
            >
              U
            </span>
          </button>
          <button
            className={optionButton}
            onClick={onStrikeSelect}
            style={{
              backgroundColor: styleState.isStrike ? "#e2e8f0" : "transparent",
            }}
          >
            <span
              style={{
                textDecoration: "line-through",
                fontWeight: "bold",
                opacity: styleState.isStrike ? 1 : 0.6,
              }}
            >
              S
            </span>
          </button>
          {/* 텍스트 색상 버튼들 */}
          <div className={optionButton} onMouseEnter={() => handleMouseEnter("text")}>
            <span className={optionButtonText}>A</span>
          </div>
          {/* 배경 색상 버튼들 */}
          <div className={optionButton} onMouseEnter={() => handleMouseEnter("background")}>
            <span className={optionButtonText}>BG</span>
          </div>
        </div>
        {hoveredType === "text" && (
          <TextColorOptionModal
            onColorSelect={handleTextColorClick}
            position={{
              top: 44,
              left: 84,
            }}
          />
        )}
        {hoveredType === "background" && (
          <BackgroundColorOptionModal
            onColorSelect={handleTextBackgroundSelect}
            position={{
              top: 44,
              left: 84,
            }}
          />
        )}
      </motion.div>
    </ModalPortal>
  );
};
