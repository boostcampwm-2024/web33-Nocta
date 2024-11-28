import { css } from "@styled-system/css";

export const pageItemContainer = css({
  display: "flex",
  position: "relative",
  gap: "lg",
  alignItems: "center",
  width: "100%",
  height: "56px",
  paddingInline: "md",
  "&:hover": {
    background: "white/50",
    cursor: "pointer",
    "& .delete_box": {
      visibility: "visible",
      opacity: 1,
    },
  },
});
export const deleteBox = css({
  display: "flex",
  visibility: "hidden",
  position: "absolute",
  right: "md",
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "xs",
  width: "24px",
  height: "24px",
  opacity: 0,
  transition: "all 0.2s ease-in-out",
  cursor: "pointer",
  "&:hover": {
    background: "gray.100",
  },
});
export const iconBox = css({
  display: "flex",
  flexShrink: 0,
  justifyContent: "center",
  alignItems: "center",
  borderRadius: "xs",
  width: "44px",
  height: "44px",
  fontSize: "24px",
});

export const textBox = css({
  textStyle: "display-medium20",
  color: "gray.700",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});
