import { css, cva } from "@styled-system/css";

export const pageControlContainer = css({
  display: "flex",
  gap: "sm",
  _hover: {
    "& svg": {
      transform: "scale(1)", // 추가 효과
      opacity: 1,
    },
  },
});

export const pageControlButton = cva({
  base: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "full",
    width: "20px",
    height: "20px",
    cursor: "pointer",
  },
  variants: {
    color: {
      yellow: { background: "yellow" },
      green: { background: "green" },
      red: { background: "red" },
    },
  },
});

export const iconBox = css({
  transform: "scale(0.8)",
  strokeWidth: "2.5px",
  width: "14px",
  height: "14px",
  color: "white/90",
  opacity: 0,
  transition: "all 0.1s ease",
});
