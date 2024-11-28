import { AnimationType, ElementType } from "@noctaCrdt/Interfaces";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { OPTION_CATEGORIES, OptionCategory } from "@src/constants/option";
import { modal } from "./OptionModal.animaiton";
import { modalContainer, optionButton, optionModal } from "./OptionModal.style";

const ModalPortal = ({ children }: { children: React.ReactNode }) => {
  return createPortal(children, document.body);
};

interface OptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimationSelect: (id: AnimationType) => void;
  onTypeSelect: (label: ElementType) => void;
  onCopySelect: () => void;
  onDeleteSelect: () => void;
  menuBlockPosition: { top: number; right: number };
}

export const OptionModal = ({
  isOpen,
  onClose,
  onAnimationSelect,
  onTypeSelect,
  onCopySelect,
  onDeleteSelect,
  menuBlockPosition,
}: OptionModalProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<OptionCategory | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const subModalRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = (category: OptionCategory) => {
    if (OPTION_CATEGORIES[category].options) {
      setHoveredCategory(category);
    } else {
      setHoveredCategory(null);
    }
  };

  const handleCategoryClick = (category: OptionCategory) => {
    if (!OPTION_CATEGORIES[category].options) {
      if (category === "DUPLICATE") {
        onCopySelect();
      } else if (category === "DELETE") {
        onDeleteSelect();
      }
      onClose();
    }
  };

  const handleOptionClick = (option: AnimationType | ElementType) => {
    if (hoveredCategory === "ANIMATION") {
      onAnimationSelect(option as AnimationType);
    } else if (hoveredCategory === "TYPE") {
      onTypeSelect(option as ElementType);
    }
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isMainModalClick = modalRef.current?.contains(target);
      const isSubModalClick = subModalRef.current?.contains(target);

      if (!isMainModalClick && !isSubModalClick) {
        setHoveredCategory(null);
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("pointerdown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <ModalPortal>
      {isOpen && (
        <>
          <motion.div
            ref={modalRef}
            className={optionModal}
            style={{
              left: `${menuBlockPosition.right}px`,
              top: `${menuBlockPosition.top - 4}px`,
            }}
            initial={modal.initial}
            animate={modal.animate}
          >
            <div className={modalContainer}>
              {Object.entries(OPTION_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  className={optionButton}
                  onMouseEnter={() => handleMouseEnter(key as OptionCategory)}
                  onClick={() => handleCategoryClick(key as OptionCategory)}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </motion.div>

          {hoveredCategory && (
            <div
              ref={subModalRef}
              className={optionModal}
              style={{
                left: `${menuBlockPosition.right + 160}px`,
                top: `${menuBlockPosition.top - 4}px`,
              }}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className={modalContainer}>
                {OPTION_CATEGORIES[hoveredCategory].options?.map((option) => (
                  <button
                    key={option.id}
                    className={optionButton}
                    onClick={() => handleOptionClick(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </ModalPortal>
  );
};
