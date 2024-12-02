import { css } from "@styled-system/css";

export const container = css({
  display: "flex",
  gap: "4",
  flexDirection: "column",
});

export const title = css({
  color: "gray.700",
  fontSize: "lg",
  fontWeight: "medium",
});

export const input = css({
  borderColor: "gray.200",
  borderRadius: "md",
  borderWidth: "1px",
  width: "full",
  paddingY: "2",
  paddingX: "3",
  _focus: {
    outline: "none",
    borderColor: "blue.500",
  },
  _hover: {
    borderColor: "gray.300",
  },
});
