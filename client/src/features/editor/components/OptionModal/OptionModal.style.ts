import { css } from "@styled-system/css";

export const optionModal = css({
  zIndex: "10000",
  position: "fixed",
  borderRadius: "8px",
  width: "160px",
  padding: "8px",
  background: "white",
  boxShadow: "md",
});

export const optionButton = css({
  borderRadius: "8px",
  width: "100%",
  paddingBlock: "4px",
  paddingInline: "8px",
  textAlign: "left",
  _hover: {
    backgroundColor: "gray.100/40",
    cursor: "pointer",
  },
});

export const optionTypeButton = css({
  borderRadius: "8px",
  width: "100%",
  paddingBlock: "4px",
  paddingInline: "8px",
  textAlign: "left",
  "&.selected": {
    backgroundColor: "gray.100/40",
  },
});

export const modalContainer = css({
  display: "flex",
  gap: "1",
  flexDirection: "column",
});
