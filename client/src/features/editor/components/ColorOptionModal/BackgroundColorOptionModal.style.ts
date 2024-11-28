import { BackgroundColorType } from "@noctaCrdt/Interfaces";
import { css, cva } from "@styled-system/css";

type ColorVariants = {
  [K in BackgroundColorType]: { backgroundColor: string };
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
  transparent: { backgroundColor: "#C1D7F4" },
  black: { backgroundColor: "#2B4158" },
  red: { backgroundColor: "#F24150" },
  green: { backgroundColor: "#1BBF44" },
  blue: { backgroundColor: "#4285F4" },
  yellow: { backgroundColor: "#FEA642" },
  purple: { backgroundColor: "#A142FE" },
  brown: { backgroundColor: "#8B4513" },
  white: { backgroundColor: "#EEEEEE" },
};

export const backgroundColorIndicator = cva({
  base: {
    borderRadius: "3px",
    width: "100%",
    height: "100%",
    transition: "all 0.2s",
  },
  variants: {
    color: colorVariants,
  },
});
