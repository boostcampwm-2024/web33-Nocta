import { TextColorType } from "@noctaCrdt/Interfaces";
import {
  colorOptionButton,
  colorPaletteContainer,
  colorPaletteModal,
  textColorIndicator,
} from "./TextColorOptionModal.style.ts";

const COLORS: TextColorType[] = [
  "black",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "brown",
  "white",
];

interface TextColorOptionModalProps {
  onColorSelect: (color: TextColorType) => void;
  position: { top: number; left: number };
}

export const TextColorOptionModal = ({ onColorSelect, position }: TextColorOptionModalProps) => {
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
            key={`text-${color}`}
            className={colorOptionButton}
            onClick={() => onColorSelect(color)}
          >
            <span className={textColorIndicator({ color })}>A</span>
          </button>
        ))}
      </div>
    </div>
  );
};
