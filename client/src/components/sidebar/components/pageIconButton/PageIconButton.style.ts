import { css } from "@styled-system/css";

export const IconBox = css({
  display: "flex",
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "4px",
  width: "24px",
  height: "24px",

  cursor: "pointer",
  "&:hover": {
    transform: "scale(1.05)",
    opacity: 0.8,
  },
});

export const IconModal = css({
  zIndex: 1001,
  borderRadius: "4px",
  minWidth: "120px", // 3x3 그리드를 위한 최소 너비
  padding: "4px",
  backgroundColor: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
});

export const IconModalContainer = css({
  display: "grid",
  gap: "4px",
  gridTemplateColumns: "repeat(3, 1fr)",
  width: "100%",
});
