import CloseIcon from "@assets/icons/close.svg?react";
import ExpandIcon from "@assets/icons/expand.svg?react";
import MinusIcon from "@assets/icons/minus.svg?react";
import { pageControlContainer, pageControlButton, iconBox } from "./PageControlButton.style";

interface PageControlButtonProps {
  isMaximized: boolean;
  onPageMinimize?: () => void;
  onPageMaximize?: () => void;
  onPageClose?: () => void;
}

export const PageControlButton = ({
  isMaximized,
  onPageMinimize,
  onPageMaximize,
  onPageClose,
}: PageControlButtonProps) => {
  return (
    <div className={pageControlContainer}>
      <button
        className={pageControlButton({ color: "yellow" })}
        onClick={onPageMinimize}
        disabled={isMaximized}
      >
        <MinusIcon className={iconBox} />
      </button>
      <button className={pageControlButton({ color: "green" })} onClick={onPageMaximize}>
        <ExpandIcon className={iconBox} />
      </button>
      <button className={pageControlButton({ color: "red" })} onClick={onPageClose}>
        <CloseIcon className={iconBox} />
      </button>
    </div>
  );
};
