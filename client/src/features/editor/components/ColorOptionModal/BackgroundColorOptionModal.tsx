import { BackgroundColorType } from "@noctaCrdt/Interfaces";
import {
  backgroundColorIndicator,
  colorOptionButton,
  colorPaletteContainer,
  colorPaletteModal,
} from "./BackgroundColorOptionModal.style.ts";

const COLORS: BackgroundColorType[] = [
  "black",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "brown",
  "white",
  "transparent",
];

interface BackgroundColorOptionModalProps {
  onColorSelect: (color: BackgroundColorType) => void;
  position: { top: number; left: number };
}

export const BackgroundColorOptionModal = ({
  onColorSelect,
  position,
}: BackgroundColorOptionModalProps) => {
  return (
    <div
      className={colorPaletteModal}
      style={{
        position: "absolute",
        top: position.top,
        left: position.left,
      }}
    >
      <div className={colorPaletteContainer}>
        {COLORS.map((color) => (
          <button
            key={`bg-${color}`}
            className={colorOptionButton}
            onClick={() => onColorSelect(color)}
          >
            <div className={backgroundColorIndicator({ color })} />
          </button>
        ))}
      </div>
    </div>
  );
};
