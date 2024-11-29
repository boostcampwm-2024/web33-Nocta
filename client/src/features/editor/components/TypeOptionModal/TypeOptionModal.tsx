import { motion } from "framer-motion";
import { ElementType } from "node_modules/@noctaCrdt/Interfaces";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OPTION_CATEGORIES } from "@src/constants/option";
import { modal } from "../OptionModal/OptionModal.animaiton";
import { modalContainer, optionModal, optionTypeButton } from "../OptionModal/OptionModal.style";

interface TypeOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTypeSelect: (type: ElementType) => void;
  position: { top: number; left: number };
}

export const TypeOptionModal = ({
  isOpen,
  onClose,
  onTypeSelect,
  position,
}: TypeOptionModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const {
    TYPE: { options },
  } = OPTION_CATEGORIES;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev <= 0 ? options.length - 1 : prev - 1));
        break;

      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev >= options.length - 1 ? 0 : prev + 1));
        break;

      case "Enter":
        e.preventDefault();
        onTypeSelect(options[selectedIndex].id);
        onClose();
        break;

      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "transparent",
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <motion.div
        ref={modalRef}
        tabIndex={0}
        className={optionModal}
        style={{
          left: `${position.left}px`,
          top: `${position.top}px`,
          outline: "none",
          zIndex: 1000,
        }}
        initial={modal.initial}
        animate={modal.animate}
        onKeyDown={handleKeyDown}
      >
        <div className={modalContainer}>
          {options.map((option, index) => (
            <button
              key={option.id}
              className={`${optionTypeButton} ${index === selectedIndex && "selected"}`}
              onClick={() => {
                onTypeSelect(option.id);
                onClose();
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </motion.div>
    </>,
    document.body,
  );
};
