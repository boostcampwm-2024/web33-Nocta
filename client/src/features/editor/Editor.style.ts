import { css } from "@styled-system/css";

export const editorContainer = css({
  width: "full",
  height: "full", // 부모 컴포넌트의 header(60px)를 제외한 높이
  margin: "spacing.lg", // 16px margin
  padding: "24px", // 24px padding
  overflowX: "hidden",
  overflowY: "auto", // 내용이 많을 경우 스크롤
  _focus: {
    outline: "none",
  },
});

export const editorTitleContainer = css({
  display: "flex",
  gap: "4px",
  flexDirection: "column",
  width: "full",
  padding: "spacing.sm",
});

export const editorTitle = css({
  textStyle: "display-medium28",
  outline: "none",
  border: "none",
  width: "full",
  paddingLeft: "7.5px",
  color: "gray.700",
  "&::placeholder": {
    color: "gray.100",
  },
});

export const checkboxContainer = css({
  display: "flex",
  gap: "spacing.sm",
  flexDirection: "row",
  alignItems: "center",
});

export const checkbox = css({
  border: "1px solid",
  borderColor: "gray.300",
  borderRadius: "4px",
  width: "16px",
  height: "16px",
  margin: "0 8px 0 0",
  cursor: "pointer",
  "&:checked": {
    borderColor: "blue.500",
    backgroundColor: "blue.500",
  },
});

export const addNewBlockButton = css({
  display: "flex",
  gap: "spacing.sm",
  borderRadius: "4px",
  padding: "spacing.sm",
  color: "gray.900",
  opacity: 0.8,
  cursor: "pointer",
  "&:hover": {
    opacity: 1,
  },
});
