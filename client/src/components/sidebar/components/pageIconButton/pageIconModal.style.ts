import { css } from "@styled-system/css";

export const IconModal = css({
  zIndex: 9000,
  position: "absolute",
  top: 14,
  left: 5,
});

export const IconModalContainer = css({
  zIndex: 1001,
  position: "relative",
  borderRadius: "4px",
  width: "100%",
  maxHeight: "80vh",
  padding: "16px 16px 0px 16px",
  backgroundColor: "white",
  boxShadow: "lg",
  overflowY: "auto",
});

export const IconModalClose = css({
  display: "flex",
  zIndex: 1002,
  position: "absolute",
  top: "-4px",
  right: "-4px",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "md",
  width: "32px",
  height: "32px",
  opacity: 0.5,
  backgroundColor: "transparent",
  cursor: "pointer",
  _hover: {
    opacity: 1,
  },
});

export const IconName = css({
  marginBottom: "8px",
  color: "gray.600",
  fontSize: "sm",
  fontWeight: "medium",
});

export const IconButton = (isSelected: boolean) =>
  css({
    display: "flex",
    gap: "4px",
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "center",
    border: "none",
    borderRadius: "4px",
    padding: "8px",
    backgroundColor: isSelected ? "rgba(220, 215, 255, 0.35)" : "transparent",
    transition: "all 0.1s ease-in-out",
    cursor: "pointer",
    _hover: {
      transform: "translateY(-2px) scale(1.1)",
    },
  });
