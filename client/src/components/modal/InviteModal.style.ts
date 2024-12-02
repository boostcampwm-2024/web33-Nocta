// InviteModal.style.ts
import { css } from "@styled-system/css";

export const modalContentContainer = css({
  display: "flex",
  gap: "16px",
  flexDirection: "column",
  width: "400px",
  padding: "16px",
});

export const titleText = css({
  color: "gray.800",
  fontSize: "xl",
  fontWeight: "bold",
});

export const descriptionText = css({
  color: "gray.600",
  fontSize: "sm",
});

export const emailInput = css({
  outline: "none",
  border: "1px solid",
  borderColor: "gray.200",
  borderRadius: "md",
  // 기본 input 스타일 추가
  width: "100%",
  padding: "8px 12px",
  fontSize: "sm",
  _placeholder: {
    color: "gray.400",
  },
  _focus: {
    borderColor: "blue.500",
    boxShadow: "0 0 0 1px blue.500",
  },
});
