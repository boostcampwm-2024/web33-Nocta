import { AnimationType, ElementType } from "@noctaCrdt/Interfaces";
import { useState, useRef } from "react";
import DraggableIcon from "@assets/icons/draggable.svg?url";
import { useModal } from "@src/components/modal/useModal";
import { OptionModal } from "../OptionModal/OptionModal";
import { menuBlockStyle, dragHandleIconStyle } from "./MenuBlock.style";

export interface MenuBlockProps {
  attributes?: Record<string, any>;
  listeners?: Record<string, any>;
  onAnimationSelect: (animation: AnimationType) => void;
  onTypeSelect: (type: ElementType) => void;
  onCopySelect: () => void;
  onDeleteSelect: () => void;
}

export const MenuBlock = ({
  attributes,
  listeners,
  onAnimationSelect,
  onTypeSelect,
  onCopySelect,
  onDeleteSelect,
}: MenuBlockProps) => {
  const menuBlockRef = useRef<HTMLDivElement>(null);

  const [pressTime, setPressTime] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [menuBlockPosition, setMenuBlockPosition] = useState<{ top: number; right: number }>({
    top: 0,
    right: 0,
  });

  const { isOpen, openModal, closeModal } = useModal();

  const handlePressStart = () => {
    const timer = setTimeout(() => {
      setIsDragging(true);
    }, 300);

    setPressTime(timer);
  };

  const handlePressEnd = () => {
    if (pressTime) {
      clearTimeout(pressTime);
      setPressTime(null);
    }

    if (!isDragging) {
      if (menuBlockRef.current) {
        const { top, right } = menuBlockRef.current.getBoundingClientRect();
        setMenuBlockPosition({ top, right });
      }
      openModal();
    }
    setIsDragging(false);
  };

  const modifiedListeners = {
    ...listeners,
    // dnd 이벤트 덮어쓰기
    onMouseDown: (e: React.MouseEvent) => {
      handlePressStart();
      listeners?.onMouseDown?.(e);
    },
    onMouseUp: (e: React.MouseEvent) => {
      handlePressEnd();
      listeners?.onMouseUp?.(e);
    },
  };

  return (
    <div
      ref={menuBlockRef}
      className={`menu_block ${isOpen ? "option_modal_open" : ""} ${menuBlockStyle}`}
      {...attributes}
      {...modifiedListeners}
    >
      <div className={dragHandleIconStyle}>
        <img src={DraggableIcon} alt="drag handle" width="10" height="10" />
      </div>
      <OptionModal
        isOpen={isOpen}
        onClose={closeModal}
        menuBlockPosition={menuBlockPosition}
        onAnimationSelect={onAnimationSelect}
        onTypeSelect={onTypeSelect}
        onDeleteSelect={onDeleteSelect}
        onCopySelect={onCopySelect}
      />
    </div>
  );
};
