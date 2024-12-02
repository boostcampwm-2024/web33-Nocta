import { css } from "@styled-system/css";

export const pageTitleContainer = css({
  display: "flex",
  gap: "8px",
  flexDirection: "row",
  alignItems: "center",
  overflow: "hidden",
});

export const pageTitle = css({
  textStyle: "display-medium24",
  alignItems: "center",
  paddingTop: "3px",
  color: "gray.500",
  textOverflow: "ellipsis",
  overflow: "hidden",
  whiteSpace: "nowrap",
});
