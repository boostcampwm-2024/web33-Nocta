import { css } from "@styled-system/css";

export const optionModal = css({
  zIndex: 1000,
  position: "fixed",
  borderRadius: "4px",
  background: "white",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
});

export const modalContainer = css({
  display: "flex",
  gap: "4px",
  padding: "8px",
});

export const optionButton = css({
  display: "flex",
  position: "relative",
  justifyContent: "center",
  alignItems: "center",
  border: "none",
  borderRadius: "4px",
  width: "28px",
  height: "28px",
  padding: "4px 8px",
  cursor: "pointer",
});

export const divider = css({
  width: "1px",
  height: "20px",
  margin: "0 8px",
});

export const optionButtonText = css({
  color: "transparent",
  fontWeight: "bold",
  opacity: 0.9,
  backgroundPosition: "0% 50%",
  backgroundClip: "text",
  backgroundImage: "linear-gradient(45deg, #2563EB 0%, #7E22CE 50%, #FF0080 100%)",
  backgroundSize: "200% 200%",
  transition: "all 0.2s ease",
  WebkitTextFillColor: "transparent",
  _hover: {
    backgroundPosition: "100% -10%",
  },
});
