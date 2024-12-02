import { css, cx } from "@styled-system/css";
import { glassContainer } from "@styled-system/recipes";

export const workspaceListContainer = css({
  display: "flex",
  gap: "8px",
  flexDirection: "column",
  padding: "md",
});

export const workspaceModalContainer = cx(
  glassContainer({
    border: "md",
    borderRadius: "bottom",
    background: "none",
    boxShadow: "bottom",
  }),
  css({
    display: "flex",
  }),
);

export const textBox = css({
  padding: "lg",
  color: "gray.500",
  textAlign: "center",
  fontSize: "md",
  whiteSpace: "pre-line",
});
