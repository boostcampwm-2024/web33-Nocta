import { TextColorType } from "@noctaCrdt/Interfaces";
import { css, cva } from "@styled-system/css";

type ColorVariants = {
  [K in TextColorType]: { color: string };
};

export const colorPaletteModal = css({
  zIndex: 1001,
  borderRadius: "4px",
  minWidth: "120px", // 3x3 그리드를 위한 최소 너비
  padding: "4px",
  backgroundColor: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
});

export const colorPaletteContainer = css({
  display: "grid",
  gap: "4px",
  gridTemplateColumns: "repeat(3, 1fr)",
  width: "100%",
});

export const colorOptionButton = css({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "4px",
  width: "28px",
  height: "28px",
  margin: "0 2px",
  padding: "2px",
  transition: "transform 0.2s",
  cursor: "pointer",
  "&:hover": {
    transform: "scale(1.1)",
  },
});

const colorVariants: ColorVariants = {
  black: { color: "#2B4158" },
  red: { color: "#E25D68" },
  green: { color: "#3BC05C" },
  blue: { color: "#6293E5" },
  yellow: { color: "#EEAF66" },
  purple: { color: "#9862CD" },
  brown: { color: "#985728" },
  white: { color: "#FFFFFF" },
};

export const textColorIndicator = cva({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    textShadow: "0.5px 0 black",
    fontSize: "16px",
    fontWeight: "bold",
  },
  variants: {
    color: colorVariants,
  },
});
